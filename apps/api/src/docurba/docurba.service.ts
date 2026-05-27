import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import Papa from 'papaparse'
import { join } from 'path'
import { PrismaService } from '../db/prisma.service'

export type DocurbaEpciResult = {
  communeCode: string
  scotName: string | null
  documentType: string | null
  approvalYear: string | null
  procedureInProgress: { type: string; documentType: string } | null
}

type AggregatedUrbanisme = Pick<DocurbaEpciResult, 'documentType' | 'approvalYear' | 'procedureInProgress'>

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const BACKGROUND_TIMEOUT_MS = 3000
const COMMUNE_CODE_COLS = ['code_insee', 'code_commune', 'commune_code']

type EpciAggState = {
  communeCode: string | null
  docTypes: Set<string>
  latestYear: string | null
  procedureInProgress: { type: string; documentType: string } | null
}

function finalizeAggState(state: EpciAggState): AggregatedUrbanisme {
  const docTypes = [...state.docTypes]
  const documentType = docTypes.includes('PLUi') ? 'PLUi' : docTypes.length === 1 ? (docTypes[0] ?? null) : docTypes.join(', ') || null
  return { documentType, approvalYear: state.latestYear, procedureInProgress: state.procedureInProgress }
}

@Injectable()
export class DocurbaService implements OnModuleInit {
  private readonly logger = new Logger(DocurbaService.name)
  constructor(private readonly prisma: PrismaService) {}

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

    const filenames = ['communes.csv', 'scots.csv', 'perimetres.csv']

    // Restore missing files from DB fallback
    await Promise.all(filenames.filter((f) => !existsSync(join(publicDir, f))).map((f) => this.restoreFromDb(publicDir, f)))

    const communesPath = join(publicDir, 'communes.csv')
    const scotsPath = join(publicDir, 'scots.csv')
    const perimetresPath = join(publicDir, 'perimetres.csv')

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

    // Persist any newly downloaded files to DB in background
    Promise.all(filenames.filter((f) => existsSync(join(publicDir, f))).map((f) => this.persistToDb(publicDir, f))).catch(() => {
      /* non-blocking */
    })
  }

  private async restoreFromDb(publicDir: string, filename: string): Promise<void> {
    try {
      const row = await this.prisma.docurbaFile.findUnique({ where: { filename } })
      if (row) {
        writeFileSync(join(publicDir, filename), row.content)
        this.logger.log(`${filename} restored from DB (${Math.round(row.content.length / 1024)}KB)`)
      } else {
        this.logger.warn(`${filename} not found in DB`)
      }
    } catch (err) {
      this.logger.error(`Failed to restore ${filename} from DB: ${(err as Error).message}`)
    }
  }

  private async persistToDb(publicDir: string, filename: string): Promise<void> {
    try {
      const content = await readFile(join(publicDir, filename))
      await this.prisma.docurbaFile.upsert({
        where: { filename },
        create: { filename, content },
        update: { content },
      })
      this.logger.log(`${filename} persisted to DB (${Math.round(content.length / 1024)}KB)`)
    } catch (err) {
      this.logger.error(`Failed to persist ${filename} to DB: ${(err as Error).message}`)
    }
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
            aggByEpci.set(siren, { communeCode, docTypes: new Set(), latestYear: null, procedureInProgress: null })
          }

          const state = aggByEpci.get(siren)!

          const docType = data['pa_type_document']
          if (docType) state.docTypes.add(docType)

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
      const urbanisme = localUrbanisme ?? { documentType: null, approvalYear: null, procedureInProgress: null }

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
