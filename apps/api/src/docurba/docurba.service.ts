import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { createReadStream, existsSync, mkdirSync } from 'fs'
import Papa from 'papaparse'
import { join } from 'path'

/** Document intercommunal approuvé, tel que nommé par Docurba : type et collectivité qui le porte. */
export type DocurbaPlanningDocument = {
  documentType: string
  carrierName: string
}

export type DocurbaEpciResult = {
  communeCode: string
  scotName: string | null
  documentType: string | null
  approvalYear: string | null
  procedureInProgress: { type: string; documentType: string } | null
  /** Documents de la famille PLUi portés sur cet EPCI, à proposer tels quels au nommage du groupe. */
  planningDocuments: DocurbaPlanningDocument[]
}

type AggregatedUrbanisme = Pick<DocurbaEpciResult, 'documentType' | 'approvalYear' | 'procedureInProgress' | 'planningDocuments'>

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const BACKGROUND_TIMEOUT_MS = 3000
const COMMUNE_CODE_COLS = ['code_insee', 'code_commune', 'commune_code']

/**
 * Docurba ne connaît pas le PLH : on retient la famille PLUi (PLUi, PLUiH, PLUiHM, PLUiM), dont les
 * variantes « H » tiennent lieu de PLH. Les PLU communaux sont écartés — un EPCI en compte autant que
 * de communes, ce qui noierait la liste proposée à l'utilisateur.
 */
const isIntercommunalDocument = (documentType: string): boolean => documentType.startsWith('PLUi')

type EpciAggState = {
  communeCode: string | null
  docTypes: Set<string>
  latestYear: string | null
  procedureInProgress: { type: string; documentType: string } | null
  /** Clé `type|porteur` pour dédoublonner les communes couvertes par un même document. */
  planningDocuments: Map<string, DocurbaPlanningDocument>
}

function finalizeAggState(state: EpciAggState): AggregatedUrbanisme {
  const docTypes = [...state.docTypes]
  const documentType = docTypes.includes('PLUi') ? 'PLUi' : docTypes.length === 1 ? (docTypes[0] ?? null) : docTypes.join(', ') || null
  return {
    documentType,
    approvalYear: state.latestYear,
    procedureInProgress: state.procedureInProgress,
    planningDocuments: [...state.planningDocuments.values()],
  }
}

@Injectable()
export class DocurbaService implements OnModuleInit {
  private readonly logger = new Logger(DocurbaService.name)

  private readonly epciCache = new Map<string, { result: DocurbaEpciResult | null; cachedAt: number }>()
  private readonly epciInFlight = new Map<string, Promise<DocurbaEpciResult | null>>()

  private epciUrbanisme = new Map<string, AggregatedUrbanisme>()
  private epciFirstCommune = new Map<string, string>()
  private communeToScot = new Map<string, string | null>()

  // Intermediate maps for the perimetres join (cleared after onModuleInit)
  private scotsByPaId = new Map<string, string>()
  private communeToPaId = new Map<string, string>()

  async onModuleInit() {
    const publicDir = join(__dirname, '..', '..', 'public', 'docurba')
    if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

    const communesPath = join(publicDir, 'communes.csv')
    const scotsPath = join(publicDir, 'scots.csv')
    const perimetresPath = join(publicDir, 'perimetres.csv')

    if (!existsSync(communesPath)) this.logger.warn('communes.csv missing — document types will be unavailable')
    if (!existsSync(scotsPath)) this.logger.warn('scots.csv missing — SCoT names will be unavailable')
    if (!existsSync(perimetresPath)) this.logger.warn('perimetres.csv missing — SCoT perimeters will be unavailable')

    await Promise.all([
      existsSync(communesPath) ? this.streamCommunesCsv(communesPath) : Promise.resolve(),
      existsSync(scotsPath) ? this.streamScotsCsv(scotsPath) : Promise.resolve(),
      existsSync(perimetresPath) ? this.streamPerimetresCsv(perimetresPath) : Promise.resolve(),
    ])

    // Join: commune → pa_id → scot_nom
    for (const [commune, paId] of this.communeToPaId) {
      this.communeToScot.set(commune, this.scotsByPaId.get(paId) ?? null)
    }

    // Free intermediate maps
    this.scotsByPaId.clear()
    this.communeToPaId.clear()
  }

  private streamCommunesCsv(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      let communeCodeCol: string | null = null
      const aggByEpci = new Map<string, EpciAggState>()

      Papa.parse(createReadStream(filePath), {
        header: true,
        skipEmptyLines: true,
        worker: false,
        step: ({ data }: { data: Record<string, string> }) => {
          const siren = data['epci_siren']
          if (!siren) return

          if (communeCodeCol === null) {
            communeCodeCol = COMMUNE_CODE_COLS.find((c) => c in data) ?? ''
          }

          if (!aggByEpci.has(siren)) {
            const communeCode = communeCodeCol ? (data[communeCodeCol] ?? null) : null
            aggByEpci.set(siren, {
              communeCode,
              docTypes: new Set(),
              latestYear: null,
              procedureInProgress: null,
              planningDocuments: new Map(),
            })
          }

          const state = aggByEpci.get(siren)!

          const docType = data['pa_type_document']
          if (docType) state.docTypes.add(docType)

          // `cp_` = collectivité porteuse (à ne pas confondre avec `pc_`, la procédure en cours).
          const carrierName = data['cp_nom']
          if (docType && carrierName && isIntercommunalDocument(docType)) {
            state.planningDocuments.set(`${docType}|${carrierName}`, { documentType: docType, carrierName })
          }

          const year = data['pa_annee_approbation']
          if (year && (!state.latestYear || year > state.latestYear)) state.latestYear = year

          const procType = data['pc_type_procedure']
          if (procType && !state.procedureInProgress) {
            state.procedureInProgress = { type: procType, documentType: data['pc_type_document'] ?? '' }
          }
        },
        complete: () => {
          for (const [epciCode, state] of aggByEpci) {
            this.epciUrbanisme.set(epciCode, finalizeAggState(state))
            if (state.communeCode) this.epciFirstCommune.set(epciCode, state.communeCode)
          }
          resolve()
        },
      })
    })
  }

  private streamScotsCsv(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      Papa.parse(createReadStream(filePath), {
        header: true,
        skipEmptyLines: true,
        worker: false,
        step: ({ data }: { data: Record<string, string> }) => {
          const paId = data['pa_id']
          const scotNom = data['scot_nom_collectivite']
          if (paId && scotNom && !this.scotsByPaId.has(paId)) {
            this.scotsByPaId.set(paId, scotNom)
          }
        },
        complete: () => resolve(),
      })
    })
  }

  private streamPerimetresCsv(filePath: string): Promise<void> {
    return new Promise((resolve) => {
      Papa.parse(createReadStream(filePath), {
        header: true,
        skipEmptyLines: true,
        worker: false,
        step: ({ data }: { data: Record<string, string> }) => {
          if (data['type_document'] !== 'SCOT' || data['opposable'] !== 'True') return
          const communeCode = data['collectivite_code']
          const procedureId = data['procedure_id']
          if (!communeCode || !procedureId || this.communeToPaId.has(communeCode)) return
          this.communeToPaId.set(communeCode, procedureId)
        },
        complete: () => resolve(),
      })
    })
  }

  private async computeForEpci(epciCode: string): Promise<DocurbaEpciResult | null> {
    try {
      const localUrbanisme = this.epciUrbanisme.get(epciCode)
      const localCommune = this.epciFirstCommune.get(epciCode)

      let firstCode: string

      if (localCommune) {
        firstCode = localCommune
      } else {
        const geoRes = await fetch(`https://geo.api.gouv.fr/epcis/${epciCode}/communes?fields=code&limit=5`)
        if (!geoRes.ok) return null
        const geoCommunes: Array<{ code: string }> = await geoRes.json()
        if (!geoCommunes || geoCommunes.length === 0) return null
        firstCode = geoCommunes[0].code
      }

      const scotName = this.communeToScot.get(firstCode) ?? null
      const urbanisme = localUrbanisme ?? { documentType: null, approvalYear: null, procedureInProgress: null, planningDocuments: [] }

      return { communeCode: firstCode, scotName, ...urbanisme }
    } catch {
      return null
    }
  }

  async getForEpci(epciCode: string): Promise<DocurbaEpciResult | null> {
    const cached = this.epciCache.get(epciCode)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.result

    let promise = this.epciInFlight.get(epciCode)
    if (!promise) {
      promise = this.computeForEpci(epciCode)
        .then((result) => {
          this.epciCache.set(epciCode, { result, cachedAt: Date.now() })
          return result
        })
        .finally(() => this.epciInFlight.delete(epciCode))
      this.epciInFlight.set(epciCode, promise)
    }

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), BACKGROUND_TIMEOUT_MS))
    return Promise.race([promise, timeout])
  }
}
