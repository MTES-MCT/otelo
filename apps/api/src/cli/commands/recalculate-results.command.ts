import { Inject, Injectable } from '@nestjs/common'
import { CoefficientCalculationService } from '~/calculation/coefficient-calculation/coefficient-calculation.service'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { ResultsService } from '~/results/results.service'
import { SimulationsService } from '~/simulations/simulations.service'

@Injectable()
export class RecalculateResultsCommand {
  constructor(
    private readonly prisma: PrismaService,
    private readonly simulationsService: SimulationsService,
    private readonly needsCalculationService: NeedsCalculationService,
    private readonly coefficientCalculationService: CoefficientCalculationService,
    private readonly resultsService: ResultsService,
    @Inject('CalculationContext') private readonly calculationContext: { coefficient: number; baseYear: number; millesime: string },
  ) {}

  async execute(options: { simulationId?: string; dryRun?: boolean }): Promise<void> {
    const { simulationId, dryRun = true } = options

    if (dryRun) {
      console.log('Mode DRY-RUN : aucune écriture en base. Utiliser --write pour persister.')
    } else {
      console.log('Mode WRITE : les résultats seront persistés en base.')
    }

    const simulations = simulationId
      ? await this.prisma.simulation.findMany({
          where: { id: simulationId, deleted: null },
          select: { id: true },
        })
      : await this.prisma.simulation.findMany({
          where: { deleted: null },
          select: { id: true },
        })

    if (simulations.length === 0) {
      console.log('Aucune simulation trouvée.')
      return
    }

    console.log(`${simulations.length} simulation(s) à recalculer\n`)

    let success = 0
    let errors = 0

    for (const [index, sim] of simulations.entries()) {
      try {
        const simulation = await this.simulationsService.get(sim.id)

        const coefficient = this.coefficientCalculationService.calculateCoefficient(
          simulation.scenario.b1_horizon_resorption,
          simulation.scenario.projection,
        )
        this.calculationContext.coefficient = coefficient
        this.calculationContext.millesime = simulation.scenario.millesime

        const results = await this.needsCalculationService.calculate(simulation)

        if (!dryRun) {
          await Promise.all([
            this.resultsService.upsertSimulationResults(simulation.id, results),
            this.resultsService.insertResultsHistory(simulation.id, results),
          ])
        }

        success++
        const epciCount = simulation.epcis.length
        console.log(
          `  [${index + 1}/${simulations.length}] ✓ ${simulation.id} (${simulation.name}) — ${epciCount} EPCI, total=${results.total}${dryRun ? '' : ' [écrit]'}`,
        )
      } catch (error) {
        errors++
        console.error(`  [${index + 1}/${simulations.length}] ✗ ${sim.id}: ${error instanceof Error ? error.message : error}`)
      }
    }

    console.log(`\nTerminé: ${success} succès, ${errors} erreur(s)`)
    if (dryRun) {
      console.log('Aucune donnée écrite en base (dry-run). Relancer avec --write pour persister.')
    }
  }
}
