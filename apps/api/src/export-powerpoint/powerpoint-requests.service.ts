import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { startOfDayInFrance } from '~/common/utils/date-range'
import { PrismaService } from '~/db/prisma.service'

/**
 * Ce qui rend une demande suspecte de faire doublon avec une demande passée.
 *
 * - `RECENT` : demande sur le même territoire il y a moins de
 *   `EXPORT_DUPLICATE_WINDOW_MINUTES` — l'agent est en train de se corriger.
 * - `SAME_DAY` : demande sur le même territoire plus tôt dans la journée.
 * - `SAME_SCENARIOS_AND_TERRITORY` : mêmes scénarios et mêmes EPCI, quelle que
 *   soit la date — le livrable demandé est littéralement le même.
 */
export type TPowerpointDuplicateReason = 'RECENT' | 'SAME_DAY' | 'SAME_SCENARIOS_AND_TERRITORY'

export type TReplaceablePowerpointRequest = {
  requestId: string
  requestedAt: Date
  documentType: string | null
  nextStep: string | null
  periodStart: number | null
  periodEnd: number | null
  simulationNames: string[]
  epciNames: string[]
  reasons: TPowerpointDuplicateReason[]
}

export type TRecordPowerpointRequestOptions = {
  privilegedSimulationId?: string
  documentType?: string
  nextStep?: string
  periodStart?: number
  periodEnd?: number
  epciCodes?: string[]
}

/** Une demande reconstituée à partir de ses lignes `exports`. */
type TPastRequest = {
  requestId: string
  createdAt: Date
  documentType: string | null
  nextStep: string | null
  periodStart: number | null
  periodEnd: number | null
  epciCodes: string[]
  simulationNames: string[]
}

const MAX_SAME_CONTENT_ROWS = 200

const normaliseCodes = (codes: string[]): string[] => [...new Set(codes.map((code) => code.trim()).filter(Boolean))].sort()

const normaliseNames = (names: string[]): string[] =>
  [...new Set(names.map((name) => name.trim().toLocaleLowerCase('fr-FR')).filter(Boolean))].sort()

const sameSet = (left: string[], right: string[]): boolean =>
  left.length > 0 && left.length === right.length && left.every((value, index) => value === right[index])

/**
 * Cycle de vie d'une demande de PowerPoint.
 *
 * Une demande correspond à un appel de `POST /export-powerpoint` et se matérialise
 * par une ligne `exports` par scénario sélectionné, toutes porteuses du même
 * `requestId`. Les agents enchaînent parfois plusieurs demandes sur un même
 * territoire pour corriger un paramétrage : la boîte Otelo reçoit alors plusieurs
 * livrables sans savoir lequel fait foi. Ce service détecte ce cas et permet de
 * marquer la demande précédente comme remplacée, pour que le mail comme les
 * statistiques ne retiennent que la bonne.
 */
@Injectable()
export class PowerpointRequestsService {
  readonly windowMinutes: number

  constructor(
    private readonly prismaService: PrismaService,
    configService: ConfigService,
  ) {
    this.windowMinutes = configService.get<number>('EXPORT_DUPLICATE_WINDOW_MINUTES', 30)
  }

  /**
   * La demande que celle en cours viendrait remplacer, s'il y en a une.
   *
   * Le périmètre commun à tous les contrôles est le groupe EPCI, c'est-à-dire le
   * tableau de bord depuis lequel l'agent travaille. Sans groupe, il n'y a pas de
   * territoire à comparer : on renvoie `null` plutôt que de confirmer à tort.
   *
   * Quand plusieurs demandes passées sont suspectes, c'est la plus récente qui est
   * proposée au remplacement : c'est celle que l'équipe Otelo a le plus de chances
   * d'avoir encore sur le feu.
   */
  async findReplaceable(userId: string, simulationIds: string[], epciCodes: string[] = []): Promise<TReplaceablePowerpointRequest | null> {
    const selected = await this.prismaService.simulation.findMany({
      where: { id: { in: simulationIds }, userId },
      select: { epciGroupId: true, name: true },
    })

    const epciGroupIds = [...new Set(selected.map((simulation) => simulation.epciGroupId).filter((id): id is string => !!id))]
    if (epciGroupIds.length === 0) return null

    const now = new Date()
    const windowStart = new Date(now.getTime() - this.windowMinutes * 60_000)
    const dayStart = startOfDayInFrance(now)
    const territory = normaliseCodes(epciCodes)
    const selectedNames = normaliseNames(selected.map((simulation) => simulation.name))

    const scope = { type: 'POWERPOINT', supersededAt: null, simulation: { userId, epciGroupId: { in: epciGroupIds } } } as const
    const include = { simulation: { select: { name: true } } } as const

    const [datedRows, sameContentRows] = await Promise.all([
      // `RECENT` et `SAME_DAY` : une seule lecture, bornée par la plus ancienne
      // des deux limites, la qualification se faisant ensuite en mémoire.
      this.prismaService.export.findMany({
        where: { ...scope, createdAt: { gte: windowStart < dayStart ? windowStart : dayStart } },
        include,
        orderBy: { createdAt: 'desc' },
      }),
      // `SAME_SCENARIOS_AND_TERRITORY` : sans borne de date, mais restreint aux
      // demandes portant exactement sur les mêmes EPCI.
      territory.length === 0
        ? Promise.resolve([])
        : this.prismaService.export.findMany({
            where: { ...scope, epciCodes: { equals: territory } },
            include,
            orderBy: { createdAt: 'desc' },
            take: MAX_SAME_CONTENT_ROWS,
          }),
    ])

    const candidates = this.groupIntoRequests([...datedRows, ...sameContentRows])

    for (const candidate of candidates) {
      const reasons: TPowerpointDuplicateReason[] = []

      if (candidate.createdAt >= windowStart) reasons.push('RECENT')
      if (candidate.createdAt >= dayStart) reasons.push('SAME_DAY')
      if (sameSet(normaliseCodes(candidate.epciCodes), territory) && sameSet(normaliseNames(candidate.simulationNames), selectedNames)) {
        reasons.push('SAME_SCENARIOS_AND_TERRITORY')
      }

      if (reasons.length === 0) continue

      return {
        requestId: candidate.requestId,
        requestedAt: candidate.createdAt,
        documentType: candidate.documentType,
        nextStep: candidate.nextStep,
        periodStart: candidate.periodStart,
        periodEnd: candidate.periodEnd,
        simulationNames: candidate.simulationNames,
        epciNames: await this.epciNamesOf(candidate.epciCodes),
        reasons,
      }
    }

    return null
  }

  /**
   * Journalise une demande et renvoie son `requestId`.
   *
   * Les réponses déclaratives du formulaire (type de document, prochaine étape,
   * période d'étude, EPCI demandés) sont persistées : c'est la seule information
   * dont on dispose sur l'usage réel du livrable, et elle n'existait auparavant
   * que dans le mail envoyé à l'équipe.
   */
  async record(simulationIds: string[], options: TRecordPowerpointRequestOptions = {}): Promise<string> {
    const { documentType, epciCodes, nextStep, periodEnd, periodStart, privilegedSimulationId } = options
    const requestId = randomUUID()

    await this.prismaService.export.createMany({
      data: simulationIds.map((simulationId) => ({
        type: 'POWERPOINT' as const,
        simulationId,
        requestId,
        // Triés à l'écriture : la comparaison de territoires se fait par égalité
        // de tableaux, qui est sensible à l'ordre.
        epciCodes: normaliseCodes(epciCodes ?? []),
        isPrivileged: privilegedSimulationId === simulationId,
        documentType: documentType ?? null,
        nextStep: nextStep ?? null,
        periodStart: periodStart ?? null,
        periodEnd: periodEnd ?? null,
      })),
    })

    return requestId
  }

  /**
   * Marque une demande comme remplacée par une autre.
   *
   * À n'appeler qu'une fois le mail de la nouvelle demande effectivement parti :
   * si l'envoi échoue, la demande précédente doit rester la référence, sinon
   * l'équipe se retrouve sans aucune demande active.
   */
  async supersede(requestId: string, supersededByRequestId: string): Promise<void> {
    await this.prismaService.export.updateMany({
      where: { requestId, supersededAt: null },
      data: { supersededAt: new Date(), supersededByRequestId },
    })
  }

  /**
   * Reconstitue les demandes à partir des lignes, de la plus récente à la plus ancienne.
   *
   * Les lignes sont dédoublonnées sur leur identifiant : une demande peut avoir été
   * ramenée à la fois par la lecture datée et par la lecture « même contenu », et
   * ses scénarios apparaîtraient sinon deux fois.
   */
  private groupIntoRequests(
    rows: Array<{
      id: string
      requestId: string
      createdAt: Date
      documentType: string | null
      nextStep: string | null
      periodStart: number | null
      periodEnd: number | null
      epciCodes: string[]
      simulation: { name: string }
    }>,
  ): TPastRequest[] {
    const byRequestId = new Map<string, TPastRequest>()
    const seenRowIds = new Set<string>()

    for (const row of rows) {
      if (seenRowIds.has(row.id)) continue
      seenRowIds.add(row.id)

      const existing = byRequestId.get(row.requestId)

      if (existing) {
        existing.simulationNames.push(row.simulation.name)
        continue
      }

      byRequestId.set(row.requestId, {
        requestId: row.requestId,
        createdAt: row.createdAt,
        documentType: row.documentType,
        nextStep: row.nextStep,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        epciCodes: row.epciCodes,
        simulationNames: [row.simulation.name],
      })
    }

    return [...byRequestId.values()].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }

  private async epciNamesOf(codes: string[]): Promise<string[]> {
    if (codes.length === 0) return []

    const epcis = await this.prismaService.epci.findMany({
      where: { code: { in: codes } },
      select: { name: true },
      orderBy: { name: 'asc' },
    })

    return epcis.map((epci) => epci.name)
  }
}
