import { randomUUID } from 'node:crypto'
import { PrismaService } from '~/db/prisma.service'
import { Role } from '~/generated/prisma/enums'

export const MILLESIME = '2021'

export const GRAND_CHALON = { code: '200069672', name: 'CA Le Grand Chalon', region: '27' }
export const AUTUNOIS = { code: '200040590', name: 'CC Le Grand Autunois Morvan', region: '27' }

/**
 * Vide les tables dans l'ordre inverse des dépendances.
 *
 * `simulations.scenario_id` est en RESTRICT : les simulations doivent partir avant
 * les scénarios, sinon la suppression est refusée.
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.export.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.scenario.deleteMany()
  await prisma.epciGroupEpcis.deleteMany()
  await prisma.epciGroup.deleteMany()
  await prisma.user.deleteMany()
  await prisma.epci.deleteMany()
  await prisma.dataPackVersion.deleteMany()
}

/** Millésime et EPCI, dont tout le reste dépend. */
export async function seedReferenceData(prisma: PrismaService): Promise<void> {
  await prisma.dataPackVersion.create({ data: { millesime: MILLESIME, label: 'Millésime de test' } })
  await prisma.epci.createMany({ data: [GRAND_CHALON, AUTUNOIS] })
}

export async function createUser(prisma: PrismaService, overrides: { role?: Role } = {}) {
  return prisma.user.create({
    data: {
      email: `agent-${randomUUID()}@ddt71.gouv.fr`,
      name: 'Agnès Martin',
      firstname: 'Agnès',
      lastname: 'Martin',
      role: overrides.role ?? Role.USER,
    },
  })
}

export async function createEpciGroup(prisma: PrismaService, userId: string, name = 'DDT 71') {
  return prisma.epciGroup.create({ data: { name, userId } })
}

export async function createSimulation(
  prisma: PrismaService,
  options: { userId: string; epciGroupId?: string; name: string; epciCodes?: string[] },
) {
  const scenario = await prisma.scenario.create({
    data: { projection: 2040, b2_scenario: 'Central_C', millesime: MILLESIME, userId: options.userId },
  })

  return prisma.simulation.create({
    data: {
      name: options.name,
      userId: options.userId,
      epciGroupId: options.epciGroupId,
      scenarioId: scenario.id,
      epcis: { connect: (options.epciCodes ?? [GRAND_CHALON.code]).map((code) => ({ code })) },
    },
  })
}

/**
 * Écrit une demande passée directement en base, en maîtrisant sa date.
 *
 * `createdAt` a une valeur par défaut : il faut le poser explicitement pour
 * fabriquer une demande d'hier ou du mois dernier.
 */
export async function insertPastRequest(
  prisma: PrismaService,
  options: {
    simulationIds: string[]
    createdAt: Date
    epciCodes: string[]
    requestId?: string
    supersededAt?: Date
    documentType?: string
  },
) {
  const requestId = options.requestId ?? randomUUID()

  await prisma.export.createMany({
    data: options.simulationIds.map((simulationId, index) => ({
      type: 'POWERPOINT' as const,
      simulationId,
      requestId,
      createdAt: options.createdAt,
      epciCodes: [...options.epciCodes].sort(),
      isPrivileged: index === 0,
      documentType: options.documentType ?? 'PLH',
      nextStep: 'Présentation aux élus',
      periodStart: 2026,
      periodEnd: 2032,
      supersededAt: options.supersededAt ?? null,
    })),
  })

  return requestId
}
