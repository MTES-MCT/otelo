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

    await Promise.all([this.upsertSimulationResults(simulationId, results), this.insertResultsHistory(simulationId, results)])
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
      const groupName = await this.prisma.epciGroup.findFirst({
        where: { id: epciGroupId, deleted: null },
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
      await Promise.all([this.upsertSimulationResults(simulation.id, results), this.insertResultsHistory(simulation.id, results)])
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

        const epciFlowRequirement = results.flowRequirement.epcis.find((e) => e.code === epciTotal.epciCode)
        const epciSitadel = results.sitadel.epcis.find((e) => e.code === epciTotal.epciCode)

        const noAccomodationEpci = results.noAccomodation.epcis.find((e) => e.epciCode === epciTotal.epciCode)
        const hostedEpci = results.hosted.epcis.find((e) => e.epciCode === epciTotal.epciCode)
        const financialInadequationEpci = results.financialInadequation.epcis.find((e) => e.epciCode === epciTotal.epciCode)
        const badQualityEpci = results.badQuality.epcis.find((e) => e.epciCode === epciTotal.epciCode)
        const physicalInadequationEpci = results.physicalInadequation.epcis.find((e) => e.epciCode === epciTotal.epciCode)

        const data = {
          totalFlux: epciTotal.totalFlux,
          totalStock: epciTotal.totalStock,
          vacantAccomodation,
          total: epciTotal.total,
          prepeakTotalStock: epciTotal.prepeakTotalStock,
          postpeakTotalStock: epciTotal.postpeakTotalStock,
          secondaryAccommodation: epciTotal.secondaryAccommodation,
          noAccomodation: noAccomodationEpci
            ? { value: noAccomodationEpci.value, prorataValue: noAccomodationEpci.prorataValue }
            : undefined,
          hosted: hostedEpci ? { value: hostedEpci.value, prorataValue: hostedEpci.prorataValue } : undefined,
          financialInadequation: financialInadequationEpci
            ? { value: financialInadequationEpci.value, prorataValue: financialInadequationEpci.prorataValue }
            : undefined,
          badQuality: badQualityEpci ? { value: badQualityEpci.value, prorataValue: badQualityEpci.prorataValue } : undefined,
          physicalInadequation: physicalInadequationEpci
            ? { value: physicalInadequationEpci.value, prorataValue: physicalInadequationEpci.prorataValue }
            : undefined,
          flowTotals: epciFlowRequirement?.totals ?? undefined,
          flowDataByYear: epciFlowRequirement?.data ?? undefined,
          sitadelData: epciSitadel?.data ?? undefined,
          calculatedAt: new Date(),
        }

        await tx.simulationResults.upsert({
          where: {
            epciCode_simulationId: {
              epciCode: epciTotal.epciCode,
              simulationId,
            },
          },
          update: data,
          create: {
            epciCode: epciTotal.epciCode,
            simulationId,
            ...data,
          },
        })
      }
    })
  }

  async insertResultsHistory(simulationId: string, results: TResults) {
    const lastEntry = await this.prisma.simulationResultsHistory.findFirst({
      where: { simulationId },
      orderBy: { calculatedAt: 'desc' },
      select: { resultsJson: true },
    })

    if (lastEntry && JSON.stringify(lastEntry.resultsJson) === JSON.stringify(results)) {
      return
    }

    await this.prisma.simulationResultsHistory.create({
      data: {
        simulationId,
        resultsJson: results as object,
      },
    })
  }
}
