import { Inject, Injectable } from '@nestjs/common'
import { TCalculationResult, TEpci } from '@shared'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { FinancialInadequation } from '~/generated/prisma/client'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class FinancialInadequationService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly ratioCalculationService: RatioCalculationService,
    private readonly badQualityService: BadQualityService,
  ) {
    super(context)
  }

  async getFinancialInadequation(epciCode: string): Promise<FinancialInadequation> {
    return this.prismaService.financialInadequation.findUniqueOrThrow({
      where: { epciCode },
    })
  }

  async calculateByEpci(simulation: TSimulationWithEpciAndScenario, epciCode: string): Promise<number> {
    const { epcis, scenario } = simulation
    const epci = epcis.find((epci) => epci.code === epciCode) as TEpci
    const region = epci.region

    let result = 0

    const financialInadequation = await this.getFinancialInadequation(epciCode)

    const badQuality = await this.badQualityService.calculateByEpci(simulation, epciCode)

    if (scenario.b13_acc) {
      result += financialInadequation[`nbAllPlus${scenario.b13_taux_effort}AccessionPropriete`]
    }
    if (scenario.b13_plp) {
      result += financialInadequation[`nbAllPlus${scenario.b13_taux_effort}ParcLocatifPrive`]
    }
    result += this.ratioCalculationService.getRatio43(scenario, region) * badQuality * -1
    result = (1 - scenario.b13_taux_reallocation / 100.0) * result

    return this.applyCoefficient(result)
  }

  async calculate(simulation: TSimulationWithEpciAndScenario): Promise<TCalculationResult> {
    const { baseYear } = this.context
    const { epcis, scenario } = simulation
    const { projection, b1_horizon_resorption: horizon } = scenario
    const results = await Promise.all(
      epcis.map(async (epci) => {
        const value = await this.calculateByEpci(simulation, epci.code)
        const prorataValue = horizon > projection ? Math.round((value * (projection - baseYear)) / (horizon - baseYear)) : Math.round(value)
        return {
          epciCode: epci.code,
          value,
          prorataValue,
        }
      }),
    )
    const total = results.reduce((sum, result) => sum + result.value, 0)
    const prorataTotal = results.reduce((sum, result) => sum + result.prorataValue, 0)
    return {
      epcis: results,
      total,
      prorataTotal,
    }
  }
}
