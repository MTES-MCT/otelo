import { Inject, Injectable } from '@nestjs/common'
import { TCalculationResult } from '@shared'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class BadQualityService extends BaseCalculator {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
  ) {
    super(context)
  }

  async getRPBadQuality(epciCode: string) {
    return this.prismaService.badQuality_RP.findUniqueOrThrow({
      where: { epciCode },
    })
  }

  async getFilocomBadQuality(epciCode: string) {
    return this.prismaService.badQuality_Filocom.findUniqueOrThrow({
      where: { epciCode },
    })
  }
  async getFFBadQuality(epciCode: string) {
    return this.prismaService.badQuality_Fonciers.findUniqueOrThrow({
      where: { epciCode },
    })
  }

  async calculateByEpci(simulation: TSimulationWithEpciAndScenario, epciCode: string): Promise<number> {
    const { scenario } = simulation
    const { b14_confort, b14_occupation, b14_qualite, b14_taux_reallocation, source_b14 } = scenario
    const sourceCalculators = {
      FF: async () => {
        const getColumnPrefix = () => {
          const qualityMap = {
            FF_Ind: 'ppSs',
            FF_ss_ent: 'ppSsEnt',
            FF_ss_ent_mvq: 'ppSsQualiEnt',
          }

          const comfortMap = {
            FF_abs_chauf: 'Chauff',
            FF_abs_sani: 'Sdb',
            FF_abs_sani_chauf: 'SdbChauff',
            FF_abs_wc: 'Wc',
            FF_abs_wc_chauf: 'WcChauff',
            FF_abs_wc_sani: 'WcSdb',
            FF_abs_wc_sani_chauf: '3elts',
          }
          const prefix = qualityMap[b14_qualite as string]
          const comfort = comfortMap[b14_confort]
          return `${prefix}${comfort}`
        }

        const foncierData = await this.getFFBadQuality(epciCode)
        const columnPrefix = getColumnPrefix()

        let sum = 0
        if (scenario.b14_occupation.includes('loc')) {
          const locColumn = `${columnPrefix}Loc`
          sum += (foncierData[locColumn] as number) || 0
        }
        if (b14_occupation.includes('prop')) {
          const pptColumn = `${columnPrefix}Ppt`
          sum += (foncierData[pptColumn] as number) || 0
        }
        return sum
      },
      Filo: async () => {
        let sum = 0
        let type: string = ''
        if (b14_occupation.includes('loc')) {
          type = 'pppiLp'
        }
        if (b14_occupation.includes('prop')) {
          type = 'pppiPo'
        }
        sum += (await this.getFilocomBadQuality(epciCode))[type]
        return sum
      },
      RP: async () => {
        const badQuality = await this.getRPBadQuality(epciCode)
        const comfortMap = {
          RP_abs_sani: {
            loc: badQuality.saniLocNonhlm,
            prop: badQuality.saniPpT,
          },
          RP_abs_sani_chfl: {
            loc: badQuality.saniChflLocNonhlm,
            prop: badQuality.saniChflPpT,
          },
        }

        let sum = 0
        if (b14_occupation.includes('loc')) {
          sum += comfortMap[b14_confort]?.loc || 0
        }
        if (b14_occupation.includes('prop')) {
          sum += comfortMap[b14_confort]?.prop || 0
        }
        return sum
      },
    }
    const result = (await sourceCalculators[source_b14]?.()) || 0

    return this.applyCoefficient(result * (1 - b14_taux_reallocation / 100.0))
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
