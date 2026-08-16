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

const IGNORED_FIELDS = new Set([
  'id',
  'userId',
  'apiConsumerId',
  'createdAt',
  'updatedAt',
  'epciScenarios',
  'demographicEvolutionOmphaleCustom',
])

const EPCI_RATE_FIELDS = [
  'b2_tx_vacance',
  'b2_tx_vacance_longue',
  'b2_tx_vacance_courte',
  'b2_tx_rs',
  'b2_tx_restructuration',
  'b2_tx_disparition',
] as const

// Les taux sont des flottants recalculés à chaque enregistrement : une comparaison stricte
// signalerait des modifications inexistantes à cause d'écarts de représentation.
const FLOAT_TOLERANCE = 1e-9

function haveSameNumbers(before: number, after: number): boolean {
  return Math.abs(before - after) < FLOAT_TOLERANCE
}

// L'ordre des tableaux d'énumération (`b11_etablissement`) n'est pas garanti par Prisma.
function haveSameItems(before: unknown[], after: unknown[]): boolean {
  if (before.length !== after.length) {
    return false
  }

  const sortedAfter = [...after].sort()

  return [...before].sort().every((item, index) => item === sortedAfter[index])
}

function hasChanged(before: unknown, after: unknown): boolean {
  if (before == null || after == null) {
    return (before ?? null) !== (after ?? null)
  }

  if (typeof before === 'number' && typeof after === 'number') {
    return !haveSameNumbers(before, after)
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    return !haveSameItems(before, after)
  }

  if (before instanceof Date && after instanceof Date) {
    return before.getTime() !== after.getTime()
  }

  return before !== after
}

// Ne compare que les champs réellement présents dans la soumission : les formulaires de
// modification n'envoient qu'une partie du scénario (démographie ou mal-logement), et
// traiter les champs absents comme mis à null inventerait des modifications.
export function computeScenarioDiff(before: ScenarioSnapshot, after: ScenarioSnapshot): ChangeEntry[] {
  const changes: ChangeEntry[] = []

  for (const [field, afterValue] of Object.entries(after)) {
    if (IGNORED_FIELDS.has(field) || afterValue === undefined) {
      continue
    }

    const beforeValue = before[field]

    if (hasChanged(beforeValue, afterValue)) {
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

      if (hasChanged(beforeEpci[rate], afterEpci[rate])) {
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

  async getScenarioSnapshot(scenarioId: string) {
    return this.prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { epciScenarios: true },
    })
  }
}
