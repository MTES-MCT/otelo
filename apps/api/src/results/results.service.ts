import { Injectable } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { TResults } from '~/schemas/results/results'
import { TGroupedSimulationWithResults, TSimulationWithResults } from '~/schemas/simulations/simulation'
import { SimulationsService } from '~/simulations/simulations.service'

@Injectable()
export class ResultsService {
  constructor(
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly prisma: PrismaService,
  ) {}

  async getResults(simulationId: string): Promise<TSimulationWithResults> {
    const simulation = await this.simulationsService.get(simulationId)
    const results = await this.needsCalculationService.calculate(simulation)

    await this.upsertSimulationResults(simulationId, results)
    return { ...simulation, results }
  }

  async getGroupedResults(simulationId: string): Promise<TGroupedSimulationWithResults> {
    const { epciGroupId } = await this.prisma.simulation.findUniqueOrThrow({
      where: { id: simulationId },
      select: { epciGroupId: true },
    })

    let simulationIds: string[]
    let epciGroupName: string = "Votre dossier d'études"

    if (epciGroupId) {
      const simulations = await this.prisma.simulation.findMany({
        where: { epciGroupId, deleted: null },
        select: { id: true },
      })
      const groupName = await this.prisma.epciGroup.findUnique({
        where: { id: epciGroupId },
        select: { name: true },
      })
      simulationIds = simulations.map((sim) => sim.id)
      epciGroupName = groupName?.name || "Votre dossier d'études"
    } else {
      simulationIds = [simulationId]
    }

    const allSimulations = await this.simulationsService.getMany(simulationIds)

    const simulations: Record<string, TSimulationWithResults> = {}

    for (const simulation of allSimulations) {
      const results = await this.needsCalculationService.calculate(simulation)
      simulations[simulation.id] = { ...simulation, results }
    }

    return {
      name: epciGroupName,
      simulations,
    }
  }

  async upsertSimulationResults(simulationId: string, results: TResults) {
    const { epcisTotals } = results

    await this.prisma.$transaction(async (tx) => {
      for (const epciTotal of epcisTotals) {
        const vacantAccomodation = epciTotal.vacantAccomodation < 0 ? Math.abs(epciTotal.vacantAccomodation) : 0
        await tx.simulationResults.upsert({
          where: {
            epciCode_simulationId: {
              epciCode: epciTotal.epciCode,
              simulationId,
            },
          },
          update: {
            totalFlux: epciTotal.totalFlux,
            totalStock: epciTotal.totalStock,
            vacantAccomodation,
          },
          create: {
            epciCode: epciTotal.epciCode,
            simulationId,
            totalFlux: epciTotal.totalFlux,
            totalStock: epciTotal.totalStock,
            vacantAccomodation,
          },
        })
      }
    })
  }
}
