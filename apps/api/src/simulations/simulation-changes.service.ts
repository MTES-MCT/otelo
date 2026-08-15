import { Injectable, Logger } from '@nestjs/common'
import { getChangeFieldLabel, type SimulationChangeAction } from '@shared'
import { PrismaService } from '~/db/prisma.service'

export type ChangeEntry = {
  field: string
  label: string
  epciCode?: string | null
  before: unknown
  after: unknown
}

type ScenarioSnapshot = Record<string, unknown> & {
  epciScenarios?: Array<Record<string, unknown> & { epciCode: string }>
}

/** Champs techniques : leur variation ne dit rien du paramétrage métier. */
const IGNORED_FIELDS = new Set([
  'id',
  'userId',
  'apiConsumerId',
  'createdAt',
  'updatedAt',
  'epciScenarios',
  'demographicEvolutionOmphaleCustom',
])

/** Taux comparés par EPCI, dans l'ordre des étapes du wizard. */
const EPCI_RATE_FIELDS = [
  'b2_tx_vacance',
  'b2_tx_vacance_longue',
  'b2_tx_vacance_courte',
  'b2_tx_rs',
  'b2_tx_restructuration',
  'b2_tx_disparition',
] as const

/**
 * Deux valeurs sont considérées égales si leur forme sérialisée l'est.
 *
 * Les taux sont des flottants recalculés à chaque enregistrement : une comparaison stricte
 * signalerait des modifications inexistantes à cause d'écarts de représentation. Les
 * tableaux d'énumération (`b11_etablissement`) sont comparés sans tenir compte de l'ordre,
 * que Prisma ne garantit pas.
 */
function isEqual(before: unknown, after: unknown): boolean {
  if (Array.isArray(before) && Array.isArray(after)) {
    return JSON.stringify([...before].sort()) === JSON.stringify([...after].sort())
  }

  if (typeof before === 'number' && typeof after === 'number') {
    return Math.abs(before - after) < 1e-9
  }

  return JSON.stringify(before ?? null) === JSON.stringify(after ?? null)
}

/**
 * Diff entre le scénario enregistré et celui soumis.
 *
 * Ne compare que les champs réellement présents dans la soumission : les formulaires de
 * modification n'envoient qu'une partie du scénario (démographie ou mal-logement), et
 * traiter les champs absents comme mis à null inventerait des modifications.
 */
export function computeScenarioDiff(before: ScenarioSnapshot, after: ScenarioSnapshot): ChangeEntry[] {
  const changes: ChangeEntry[] = []

  for (const [field, afterValue] of Object.entries(after)) {
    if (IGNORED_FIELDS.has(field) || afterValue === undefined) {
      continue
    }

    const beforeValue = before[field]

    if (!isEqual(beforeValue, afterValue)) {
      changes.push({ field, label: getChangeFieldLabel(field), before: beforeValue ?? null, after: afterValue })
    }
  }

  const beforeRatesByEpci = new Map((before.epciScenarios ?? []).map((epci) => [epci.epciCode, epci]))

  for (const afterEpci of after.epciScenarios ?? []) {
    const beforeEpci = beforeRatesByEpci.get(afterEpci.epciCode)

    if (!beforeEpci) {
      continue
    }

    for (const rate of EPCI_RATE_FIELDS) {
      if (afterEpci[rate] === undefined) {
        continue
      }

      if (!isEqual(beforeEpci[rate], afterEpci[rate])) {
        const field = `${afterEpci.epciCode}.${rate}`
        changes.push({
          field,
          label: getChangeFieldLabel(field),
          epciCode: afterEpci.epciCode,
          before: beforeEpci[rate] ?? null,
          after: afterEpci[rate],
        })
      }
    }
  }

  return changes
}

/**
 * Journalise les modifications apportées aux simulations.
 *
 * Les paramètres sont écrasés en place dans `scenarios` et `epci_scenarios` : sans ce
 * journal, `updatedAt` indique qu'une modification a eu lieu, jamais laquelle.
 *
 * Aucune écriture ici ne doit pouvoir faire échouer l'opération métier qu'elle décrit.
 */
@Injectable()
export class SimulationChangesService {
  private readonly logger = new Logger(SimulationChangesService.name)

  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    simulationId: string
    userId?: string | null
    action: SimulationChangeAction
    changes?: ChangeEntry[]
  }): Promise<void> {
    const { action, changes, simulationId, userId } = params

    // Un enregistrement sans modification effective (l'utilisateur revalide le formulaire
    // sans rien toucher) ne doit pas polluer l'historique.
    if (action === 'scenario.updated' && (!changes || changes.length === 0)) {
      return
    }

    try {
      const user = userId ? await this.prisma.user.findUnique({ where: { id: userId }, select: { firstname: true, lastname: true } }) : null

      await this.prisma.simulationChange.create({
        data: {
          simulationId,
          userId: userId ?? null,
          userName: user ? `${user.firstname} ${user.lastname}` : null,
          action,
          changes: changes ?? undefined,
        },
      })
    } catch (error) {
      this.logger.error(`Failed to record simulation change "${action}" for ${simulationId}`, error)
    }
  }

  /** Instantané du scénario avant modification, pour comparaison. */
  async getScenarioSnapshot(scenarioId: string) {
    return this.prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { epciScenarios: true },
    })
  }
}
