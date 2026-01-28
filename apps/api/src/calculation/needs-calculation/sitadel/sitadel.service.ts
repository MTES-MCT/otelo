import { Inject, Injectable } from '@nestjs/common'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TSitadelData, TSitadelDataResult } from '@shared'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class SitadelService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async calculate(simulation: TSimulationWithEpciAndScenario): Promise<TSitadelDataResult> {
    const { epcis } = simulation
    const results = await Promise.all(epcis.map((epci) => this.calculateByEpci(simulation, epci.code)))
    return {
      epcis: results,
    }
  }

  async calculateByEpci(_: TSimulationWithEpciAndScenario, epciCode: string): Promise<TSitadelData> {
    const sitadel = await this.prismaService.sitadel.findMany({
      orderBy: {
        year: 'asc',
      },
      select: {
        authorizedHousingCount: true,
        startedHousingCount: true,
        year: true,
      },
      where: {
        epciCode,
      },
    })
    const { max, min } = sitadel.reduce(
      (acc, data) => {
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'year') {
            const numValue = Number(value)
            acc.min = Math.min(acc.min, numValue)
            acc.max = Math.max(acc.max, numValue)
          }
        })
        return acc
      },
      { max: -Infinity, min: Infinity },
    )
    return {
      code: epciCode,
      data: sitadel,
      metadata: {
        max,
        min,
      },
    }
  }
}
