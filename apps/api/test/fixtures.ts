import { randomUUID } from 'node:crypto'
import { PrismaService } from '~/db/prisma.service'
import { Role, UserType } from '~/generated/prisma/enums'

export const MILLESIME = '2021'

export const GRAND_CHALON = { code: '200069672', name: 'CA Le Grand Chalon', region: '27' }
export const AUTUNOIS = { code: '200040590', name: 'CC Le Grand Autunois Morvan', region: '27' }

const SAONE_ET_LOIRE = { departmentCode: '71', departmentName: 'Saône-et-Loire', regionName: 'Bourgogne-Franche-Comté' }

/** Populations du dernier recensement posées par `seedReferenceData`. */
export const POPULATIONS = { [GRAND_CHALON.code]: 110_000, [AUTUNOIS.code]: 35_000 }

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
  await prisma.apiConsumer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.ePCIScenario.deleteMany()
  await prisma.rP.deleteMany()
  await prisma.epci.deleteMany()
  await prisma.dataPackVersion.deleteMany()
}

/** Millésime et EPCI, dont tout le reste dépend. */
export async function seedReferenceData(prisma: PrismaService): Promise<void> {
  await prisma.dataPackVersion.create({ data: { millesime: MILLESIME, label: 'Millésime de test' } })
  await prisma.epci.createMany({
    data: [GRAND_CHALON, AUTUNOIS].map((epci) => ({ ...epci, ...SAONE_ET_LOIRE })),
  })
  await prisma.rP.createMany({
    data: Object.entries(POPULATIONS).map(([epciCode, population]) => ({
      epciCode,
      year: 2021,
      millesime: MILLESIME,
      population,
      menage: 0,
      vacant: 0,
      principalAccommodation: 0,
      secondaryAccommodation: 0,
      totalAccommodation: 0,
    })),
  })
}

export async function createUser(
  prisma: PrismaService,
  overrides: { role?: Role; type?: UserType; engaged?: boolean; excludedFromStatistics?: boolean } = {},
) {
  return prisma.user.create({
    data: {
      email: `agent-${randomUUID()}@ddt71.gouv.fr`,
      name: 'Agnès Martin',
      firstname: 'Agnès',
      lastname: 'Martin',
      role: overrides.role ?? Role.USER,
      type: overrides.type,
      engaged: overrides.engaged,
      excludedFromStatistics: overrides.excludedFromStatistics,
    },
  })
}

export async function createEpciGroup(prisma: PrismaService, userId: string, name = 'DDT 71') {
  return prisma.epciGroup.create({ data: { name, userId } })
}

/** Clé d'API externe : ses simulations n'appartiennent à aucun utilisateur. */
export async function createApiConsumer(prisma: PrismaService, overrides: { excludedFromStatistics?: boolean } = {}) {
  const id = randomUUID()
  return prisma.apiConsumer.create({
    data: {
      name: `Bureau d'études ${id}`,
      hashedKey: id,
      prefix: id.slice(0, 8),
      excludedFromStatistics: overrides.excludedFromStatistics,
    },
  })
}

export async function createSimulation(
  prisma: PrismaService,
  options: { userId?: string; apiConsumerId?: string; epciGroupId?: string; name: string; epciCodes?: string[] },
) {
  const epciCodes = options.epciCodes ?? [GRAND_CHALON.code]
  const scenario = await prisma.scenario.create({
    data: {
      projection: 2040,
      b2_scenario: 'Central_C',
      millesime: MILLESIME,
      userId: options.userId,
      apiConsumerId: options.apiConsumerId,
      epciScenarios: { create: epciCodes.map((epciCode, index) => ({ epciCode, baseEpci: index === 0 })) },
    },
  })

  return prisma.simulation.create({
    data: {
      name: options.name,
      userId: options.userId,
      apiConsumerId: options.apiConsumerId,
      epciGroupId: options.epciGroupId,
      scenarioId: scenario.id,
      epcis: { connect: epciCodes.map((code) => ({ code })) },
    },
  })
}

/** Export PowerPoint d'une simulation, une ligne comme en écrit une demande à un seul scénario. */
export async function createExport(
  prisma: PrismaService,
  options: { simulationId: string; createdAt?: Date; type?: 'POWERPOINT' | 'EXCEL' },
) {
  return prisma.export.create({
    data: {
      type: options.type ?? 'POWERPOINT',
      simulationId: options.simulationId,
      createdAt: options.createdAt,
      epciCodes: [],
      isPrivileged: true,
    },
  })
}

/** Suppression logique, comme la pratique l'application. */
export async function softDeleteSimulation(prisma: PrismaService, id: string) {
  return prisma.simulation.update({ where: { id }, data: { deleted: new Date() } })
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
