import { Injectable, NotFoundException } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { ResultsService } from '~/results/results.service'
import { TExternalUpdateScenario } from '~/schemas/scenarios/scenario'
import { SimulationsService } from '~/simulations/simulations.service'
import { CreateSimulationDto } from './external.dto'

@Injectable()
export class ExternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly resultsService: ResultsService,
  ) {}

  async createSimulation(apiConsumerId: string, data: CreateSimulationDto) {
    const { epcis, millesime, ...scenarioFields } = data.scenario

    const epciScenariosData = Object.entries(epcis).map(([code, epciScenario]) => ({
      epciCode: code,
      ...epciScenario,
    }))

    const scenario = await this.prisma.scenario.create({
      data: {
        ...scenarioFields,
        ...(millesime && { dataPackVersion: { connect: { millesime } } }),
        epciScenarios: {
          createMany: { data: epciScenariosData },
        },
        apiConsumer: { connect: { id: apiConsumerId } },
      },
    })

    let epciGroupId: string | undefined

    if (data.epciGroupName) {
      const epciGroup = await this.prisma.epciGroup.create({
        data: {
          name: data.epciGroupName,
          apiConsumerId,
          epciGroupEpcis: {
            create: data.epci.map((e) => ({ epciCode: e.code })),
          },
        },
      })
      epciGroupId = epciGroup.id
    }

    const simulation = await this.prisma.simulation.create({
      data: {
        name: data.name,
        epcis: {
          connect: data.epci.map((e) => ({ code: e.code })),
        },
        scenario: { connect: { id: scenario.id } },
        apiConsumer: { connect: { id: apiConsumerId } },
        ...(epciGroupId && { epciGroup: { connect: { id: epciGroupId } } }),
      },
    })

    const fullSimulation = await this.simulationsService.get(simulation.id)
    const results = await this.needsCalculationService.calculate(fullSimulation)

    await Promise.all([
      this.resultsService.upsertSimulationResults(simulation.id, results),
      this.resultsService.insertResultsHistory(simulation.id, results),
    ])

    return { ...fullSimulation, results }
  }

  async updateSimulation(apiConsumerId: string, simulationId: string, data: TExternalUpdateScenario) {
    await this.verifyOwnership(apiConsumerId, simulationId)

    const simulation = await this.prisma.simulation.findUniqueOrThrow({
      where: { id: simulationId },
      select: { scenarioId: true },
    })

    const { epciScenarios, ...scenarioUpdates } = data

    await this.prisma.scenario.update({
      data: {
        ...scenarioUpdates,
        ...(epciScenarios && {
          epciScenarios: {
            updateMany: Object.entries(epciScenarios).map(([epciCode, txValues]) => ({
              where: { scenarioId: simulation.scenarioId, epciCode },
              data: txValues,
            })),
          },
        }),
      },
      where: { id: simulation.scenarioId },
    })

    const fullSimulation = await this.simulationsService.get(simulationId)
    const results = await this.needsCalculationService.calculate(fullSimulation)

    await Promise.all([
      this.resultsService.upsertSimulationResults(simulationId, results),
      this.resultsService.insertResultsHistory(simulationId, results),
    ])

    return { ...fullSimulation, results }
  }

  async getResults(apiConsumerId: string, simulationId: string) {
    await this.verifyOwnership(apiConsumerId, simulationId)

    const fullSimulation = await this.simulationsService.get(simulationId)
    const results = await this.needsCalculationService.calculate(fullSimulation)

    return { ...fullSimulation, results }
  }

  async listSimulations(apiConsumerId: string) {
    const simulations = await this.prisma.simulation.findMany({
      select: {
        createdAt: true,
        name: true,
        epcis: { select: { code: true, name: true, region: true, bassinName: true } },
        scenario: { select: { b2_scenario: true, projection: true } },
        id: true,
        updatedAt: true,
        epciGroup: { select: { id: true, name: true } },
      },
      where: { apiConsumerId, deleted: null },
      orderBy: { updatedAt: 'desc' },
    })

    return simulations.map((simulation) => ({
      ...simulation,
      epciGroup: simulation.epciGroup || undefined,
    }))
  }

  async deleteSimulation(apiConsumerId: string, simulationId: string) {
    await this.verifyOwnership(apiConsumerId, simulationId)

    return this.prisma.simulation.update({
      where: { id: simulationId },
      data: { deleted: new Date() },
    })
  }

  private async verifyOwnership(apiConsumerId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: { id: simulationId, apiConsumerId, deleted: null },
    })

    if (!simulation) {
      throw new NotFoundException('Simulation not found')
    }
  }
}
