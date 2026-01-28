import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import {
  EOmphale,
  TDemographicEvolution,
  TGetDemographicEvolution,
  TGetDemographicEvolutionByOmphaleQuery,
  TGetDemographicEvolutionByYearAndOmphaleQuery,
} from '~/schemas/demographic-evolution/demographic-evolution'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

export const omphaleMap = {
  central_b: EOmphale.CENTRAL_B,
  central_c: EOmphale.CENTRAL_C,
  central_h: EOmphale.CENTRAL_H,
  pb_b: EOmphale.PB_B,
  pb_c: EOmphale.PB_C,
  pb_h: EOmphale.PB_H,
  ph_b: EOmphale.PH_B,
  ph_c: EOmphale.PH_C,
  ph_h: EOmphale.PH_H,
}

@Injectable()
export class DemographicEvolutionService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {}

  async getProjectionByYearAndOmphale(query: TGetDemographicEvolutionByYearAndOmphaleQuery): Promise<TGetDemographicEvolution> {
    const { epciCode } = query
    const { omphale, year } = query

    const demographicEvolution = await this.prismaService.demographicEvolutionOmphale.findFirstOrThrow({
      select: { epciCode: true, [omphale]: true, year: true },
      where: {
        epciCode,
        year,
      },
    })

    return {
      centralB: demographicEvolution.centralB,
      centralC: demographicEvolution.centralC,
      centralH: demographicEvolution.centralH,
      epciCode,
      pbB: demographicEvolution.pbB,
      pbC: demographicEvolution.pbC,
      pbH: demographicEvolution.pbH,
      phB: demographicEvolution.phB,
      phC: demographicEvolution.phC,
      phH: demographicEvolution.phH,
      year,
    }
  }

  async getProjectionsByOmphale(
    query: TGetDemographicEvolutionByOmphaleQuery,
    yearProjection: number,
  ): Promise<TGetDemographicEvolution[]> {
    const { epciCode, omphale } = query

    const demographicEvolutions = await this.prismaService.demographicEvolutionOmphale.findMany({
      select: { epciCode: true, [omphale]: true, year: true },
      where: {
        epciCode,
        year: {
          lte: yearProjection,
        },
      },
    })

    return demographicEvolutions.map((d) => ({
      epciCode: d.epciCode,
      [omphale]: d[omphale],
      year: d.year,
    }))
  }

  async calculateOmphaleProjectionsByYearAndEpci(
    menagesEvolution: TGetDemographicEvolution[],
    simulation: TSimulationWithEpciAndScenario,
    baseYear?: number,
  ): Promise<TDemographicEvolution> {
    const { baseYear: baseYearContext } = this.context
    const { scenario } = simulation

    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]
    const omphaleBaseYear = baseYear ?? baseYearContext

    const sortedProjections = menagesEvolution.sort((a, b) => a.year - b.year).filter(({ year }) => year >= omphaleBaseYear)

    const { max, min, periodMax, periodMin, yearlyData } = sortedProjections.reduce(
      (acc, projection, index) => {
        const currentValue = projection[omphale]
        const previousValue = index > 0 ? sortedProjections[index - 1][omphale] : projection[omphale]
        const value = currentValue - previousValue

        return {
          max: Math.max(acc.max, value),
          min: Math.min(acc.min, value),
          periodMax: Math.max(acc.periodMax, projection.year),
          periodMin: Math.min(acc.periodMin, projection.year),
          yearlyData: [...acc.yearlyData, { value, year: projection.year, yearValue: currentValue, previousYearValue: previousValue }],
        }
      },
      {
        max: -Infinity,
        min: Infinity,
        periodMax: -Infinity,
        periodMin: Infinity,
        yearlyData: [] as { value: number; year: number; yearValue: number; previousYearValue: number }[],
      },
    )

    return {
      data: yearlyData,
      metadata: {
        data: {
          max,
          min,
        },
        period: {
          endYear: periodMax,
          startYear: periodMin,
        },
      },
    }
  }
}
