import { Inject, Injectable } from '@nestjs/common'
import { TCalculationResult } from '@shared'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { HostedFilocom, HostedSne } from '~/generated/prisma/client'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class HostedService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getHostedFilocom(epciCode: string): Promise<HostedFilocom> {
    return this.prismaService.hostedFilocom.findFirstOrThrow({
      where: {
        epciCode,
        millesime: this.context.millesime,
      },
    })
  }

  async getHostedSne(epciCode: string): Promise<HostedSne> {
    return this.prismaService.hostedSne.findFirstOrThrow({
      where: {
        epciCode,
        millesime: this.context.millesime,
      },
    })
  }

  async calculateByEpci(simulation: TSimulationWithEpciAndScenario, epciCode: string): Promise<number> {
    const { scenario } = simulation

    const hostedFilocom = await this.getHostedFilocom(epciCode)
    let result = (scenario.b12_cohab_interg_subie / 100) * hostedFilocom.value

    const { particular, temporary } = await this.getHostedSne(epciCode)
    if (scenario.b12_heberg_particulier) {
      result += particular
    }

    if (scenario.b12_heberg_temporaire) {
      result += temporary
    }
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
