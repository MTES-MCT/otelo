import { ForbiddenException, Injectable } from '@nestjs/common'
import { TEpci } from '@shared'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { PrismaService } from '~/db/prisma.service'
import { EpciGroupsService } from '~/epci-groups/epci-groups.service'
import { Simulation } from '~/generated/prisma/client'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TCloneSimulationDto, TSimulationWithEpci, TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
@Injectable()
export class SimulationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly scenariosService: ScenariosService,
    private readonly epciGroupsService: EpciGroupsService,
    private readonly accommodationRatesService: AccommodationRatesService,
  ) {}

  async hasUserAccessTo(id: string, userId: string): Promise<boolean> {
    return !!(await this.prismaService.simulation.findFirst({
      where: { id, userId },
    }))
  }

  async hasUserAccessToAll(ids: string[], userId: string): Promise<boolean> {
    const count = await this.prismaService.simulation.count({
      where: { id: { in: ids }, userId },
    })
    return count === ids.length
  }

  async list(userId: string): Promise<TSimulationWithEpci[]> {
    const simulations = await this.prismaService.simulation.findMany({
      select: {
        createdAt: true,
        name: true,
        epcis: { select: { code: true, name: true, region: true, bassinName: true } },
        scenario: { select: { b2_scenario: true, projection: true, millesime: true } },
        id: true,
        updatedAt: true,
        userId: true,
        epciGroup: { select: { id: true, name: true } },
      },
      where: { userId, deleted: null },
      orderBy: { updatedAt: 'desc' },
    })

    return simulations.map((simulation) => ({
      ...simulation,
      epciGroup: simulation.epciGroup || undefined,
    }))
  }

  async get(id: string): Promise<TSimulationWithEpciAndScenario> {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { demographicEvolutionOmphaleCustom: true } },
      },
      where: { id, deleted: null },
    })
    const scenario = await this.scenariosService.get(simulation.scenario.id)

    const sortedEpcis = simulation.epcis.sort((a, b) => {
      const aScenario = scenario.epciScenarios.find((s) => s.epciCode === a.code)
      const bScenario = scenario.epciScenarios.find((s) => s.epciCode === b.code)

      if (!aScenario || !bScenario) return 0
      if (aScenario.baseEpci === bScenario.baseEpci) return 0
      return aScenario.baseEpci ? -1 : 1
    })

    return {
      name: simulation.name,
      createdAt: simulation.createdAt,
      epcis: sortedEpcis,
      id: simulation.id,
      userId: simulation.userId,
      scenario: scenario as TSimulationWithEpciAndScenario['scenario'],
      updatedAt: simulation.updatedAt,
    }
  }

  async getMany(ids: string[]): Promise<TSimulationWithEpciAndScenario[]> {
    const simulations = await this.prismaService.simulation.findMany({
      include: {
        epcis: { select: { code: true, name: true, bassinName: true } },
        scenario: { include: { epciScenarios: true, demographicEvolutionOmphaleCustom: true } },
      },
      where: { id: { in: ids }, deleted: null },
    })

    return simulations as TSimulationWithEpciAndScenario[]
  }

  async getScenario(id: string) {
    const simulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: { scenario: { select: { id: true } } },
      where: { id, deleted: null },
    })
    const scenario = await this.scenariosService.get(simulation.scenario.id)
    return { id, scenario }
  }

  async create(userId: string, data: TInitSimulation): Promise<Simulation> {
    let epciGroupId = data.epciGroupId

    if (epciGroupId) {
      const hasAccess = await this.epciGroupsService.hasUserAccessTo(epciGroupId, userId)
      if (!hasAccess) {
        throw new ForbiddenException()
      }
    }

    const scenario = await this.scenariosService.create(userId, data.scenario, data.millesime)

    if (data.epciGroupName && !epciGroupId) {
      const epciGroup = await this.epciGroupsService.create(userId, {
        name: data.epciGroupName,
        epciCodes: data.epci.map((epci) => epci.code),
      })
      epciGroupId = epciGroup.id
    }

    return this.prismaService.simulation.create({
      data: {
        epcis: {
          connect: data.epci.map((epci) => ({ code: epci.code })),
        },
        name: data.name,
        scenario: { connect: { id: scenario.id } },
        user: { connect: { id: userId } },
        ...(epciGroupId && { epciGroup: { connect: { id: epciGroupId } } }),
      },
    })
  }

  async update(id: string, data: TUpdateSimulationDto): Promise<TSimulationWithEpciAndScenario> {
    await this.scenariosService.update(data.id, data)
    return this.get(id)
  }

  async delete(userId: string, id: string): Promise<Simulation> {
    const simulation = await this.prismaService.simulation.update({
      where: { id, userId },
      data: { deleted: new Date() },
    })

    if (simulation.epciGroupId) {
      const remainingCount = await this.prismaService.simulation.count({
        where: { epciGroupId: simulation.epciGroupId, deleted: null },
      })

      if (remainingCount === 0) {
        await this.prismaService.epciGroup.update({
          where: { id: simulation.epciGroupId },
          data: { deleted: new Date() },
        })
      }
    }

    return simulation
  }

  async clone(userId: string, originalId: string, data: TCloneSimulationDto): Promise<Simulation> {
    const originalSimulation = await this.prismaService.simulation.findUniqueOrThrow({
      include: {
        scenario: { include: { epciScenarios: true } },
        epcis: { select: { code: true } },
      },
      where: { id: originalId, userId },
    })

    const { userId: _, id, ...scenarioData } = originalSimulation.scenario

    const clonedScenario = await this.scenariosService.create(userId, {
      ...scenarioData,
      epcis: originalSimulation.scenario.epciScenarios.reduce((acc, epciScenario) => {
        acc[epciScenario.epciCode] = {
          b2_tx_rs: epciScenario.b2_tx_rs,
          b2_tx_vacance: epciScenario.b2_tx_vacance,
          b2_tx_vacance_longue: epciScenario.b2_tx_vacance_longue,
          b2_tx_vacance_courte: epciScenario.b2_tx_vacance_courte,
          b2_tx_disparition: epciScenario.b2_tx_disparition,
          b2_tx_restructuration: epciScenario.b2_tx_restructuration,
          baseEpci: epciScenario.baseEpci,
        }
        return acc
      }, {}),
    })

    return this.prismaService.simulation.create({
      data: {
        name: data.name,
        epcis: {
          connect: originalSimulation.epcis.map((epci) => ({ code: epci.code })),
        },
        scenario: { connect: { id: clonedScenario.id } },
        user: { connect: { id: userId } },
        ...(originalSimulation.epciGroupId && { epciGroup: { connect: { id: originalSimulation.epciGroupId } } }),
      },
    })
  }

  async actualize(userId: string, originalId: string, targetMillesime: string, name?: string): Promise<Simulation> {
    const original = await this.prismaService.simulation.findUniqueOrThrow({
      where: { id: originalId, userId },
      include: {
        epcis: { select: { code: true } },
        scenario: { select: { millesime: true, epciScenarios: true } },
      },
    })
    const cloneName = name || `${original.name} (millésime ${targetMillesime})`
    const cloned = await this.clone(userId, originalId, {
      name: cloneName,
    })
    const clonedSimulation = await this.prismaService.simulation.findUniqueOrThrow({
      where: { id: cloned.id },
      select: { scenarioId: true },
    })

    // Update millesime on the cloned scenario
    await this.prismaService.scenario.update({
      where: { id: clonedSimulation.scenarioId },
      data: { millesime: targetMillesime },
    })

    const epciCodes = original.epcis.map((e) => e.code)

    // Fetch raw rates for both the original and target millesimes
    const [originalRawRates, freshRates] = await Promise.all([
      this.accommodationRatesService.getAccommodationRates(epciCodes.join(','), original.scenario.millesime),
      this.accommodationRatesService.getAccommodationRates(epciCodes.join(','), targetMillesime),
    ])

    // Update each epciScenario with fresh rates, preserving user-applied reduction ratios
    await Promise.all(
      epciCodes.map((epciCode) => {
        const fresh = freshRates[epciCode]
        const originalRaw = originalRawRates[epciCode]
        const originalEpci = original.scenario.epciScenarios.find((e) => e.epciCode === epciCode)

        if (!fresh || !originalRaw || !originalEpci) return Promise.resolve()

        const ratio = (stored: number, raw: number) => (raw > 0 ? stored / raw : 1)

        return this.prismaService.ePCIScenario.updateMany({
          where: { scenarioId: clonedSimulation.scenarioId, epciCode },
          data: {
            b2_tx_rs: fresh.txRs * ratio(originalEpci.b2_tx_rs, originalRaw.txRs),
            b2_tx_vacance: fresh.vacancyRate * ratio(originalEpci.b2_tx_vacance, originalRaw.vacancyRate),
            b2_tx_vacance_longue: fresh.longTermVacancyRate * ratio(originalEpci.b2_tx_vacance_longue, originalRaw.longTermVacancyRate),
            b2_tx_vacance_courte: fresh.shortTermVacancyRate * ratio(originalEpci.b2_tx_vacance_courte, originalRaw.shortTermVacancyRate),
            b2_tx_restructuration: fresh.restructuringRate * ratio(originalEpci.b2_tx_restructuration, originalRaw.restructuringRate),
            b2_tx_disparition: fresh.disappearanceRate * ratio(originalEpci.b2_tx_disparition, originalRaw.disappearanceRate),
          },
        })
      }),
    )

    return cloned
  }

  /**
   * Gets the list of simulations for a user and groups them by their epciGroup ID.
   */
  async getDashboardList(userId: string) {
    const simulations = await this.list(userId)

    // Group simulations by their epciGroup ID
    const groupedSimulations: Array<{
      id: string
      name: string
      simulations: TSimulationWithEpci[]
      epcis: Omit<TEpci, 'region'>[]
    }> = []

    // First, group by epciGroup ID or 'autres' for ungrouped
    const simulationsByGroupId: Record<string, TSimulationWithEpci[]> = {}

    simulations.forEach((simulation) => {
      const groupId = simulation.epciGroup?.id || 'autres'
      simulationsByGroupId[groupId] = simulationsByGroupId[groupId] || []
      simulationsByGroupId[groupId].push(simulation)
    })

    // Convert to array format with proper structure
    Object.entries(simulationsByGroupId).forEach(([groupId, sims]) => {
      // Collect all EPCI codes from all simulations in this group and deduplicate
      const allEpcis = sims.flatMap((sim) => sim.epcis)
      const uniqueEpcis = Array.from(new Map(allEpcis.map((epci) => [epci.code, epci])).values())

      if (groupId === 'autres') {
        groupedSimulations.push({
          id: 'autres',
          name: 'Autres',
          simulations: sims,
          epcis: uniqueEpcis,
        })
      } else {
        // Get the group name from any simulation in this group
        const groupName = sims[0].epciGroup?.name || 'Unknown'
        groupedSimulations.push({
          id: groupId,
          name: groupName,
          simulations: sims,
          epcis: uniqueEpcis,
        })
      }
    })

    return groupedSimulations
  }

  async markAsExported(simulationIds: string[], privilegedSimulationId?: string): Promise<void> {
    await this.prismaService.export.createMany({
      data: simulationIds.map((simulationId) => ({
        type: 'POWERPOINT',
        simulationId,
        isPrivileged: privilegedSimulationId === simulationId,
      })),
    })
  }
}
