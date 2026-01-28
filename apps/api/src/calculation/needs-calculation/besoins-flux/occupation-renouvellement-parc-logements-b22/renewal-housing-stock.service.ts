import { Inject, Injectable } from '@nestjs/common'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { PrismaService } from '~/db/prisma.service'
import { FilocomFlux } from '~/generated/prisma/client'
import { TScenario } from '~/schemas/scenarios/scenario'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class RenewalHousingStockService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly prismaService: PrismaService,
    private readonly accommodationRatesService: AccommodationRatesService,
  ) {}

  async getFilocomFlux(epciCode: string): Promise<FilocomFlux> {
    return this.prismaService.filocomFlux.findFirstOrThrow({
      where: {
        epciCode,
      },
    })
  }

  private async getVacantAccommodationRate(
    scenario: TScenario,
    defaultVacancyRate: number,
    epciCode: string,
    type: 'short' | 'long' | 'total' = 'total',
  ): Promise<number> {
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    const shortTermRate = epciScenario?.b2_tx_vacance_courte !== undefined ? epciScenario.b2_tx_vacance_courte : defaultVacancyRate
    const longTermRate = epciScenario?.b2_tx_vacance_longue !== undefined ? epciScenario.b2_tx_vacance_longue : defaultVacancyRate

    switch (type) {
      case 'short':
        return shortTermRate
      case 'long':
        return longTermRate
      case 'total':
      default:
        return shortTermRate + longTermRate
    }
  }

  private getSecondaryResidenceRate(scenario: TScenario, defaultSecondaryResidenceRate: number, epciCode: string): number {
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)

    return epciScenario?.b2_tx_rs ?? defaultSecondaryResidenceRate
  }

  async getVacantAccomodationEvolutionByEpciAndYear(
    scenario: TScenario,
    epciCode: string,
    peakYear: number,
    type: 'short' | 'long' | 'total' = 'total',
  ): Promise<Record<number, number>> {
    const { projection } = scenario
    const { baseYear } = this.context
    const accommodationRates = await this.accommodationRatesService.getAccommodationRates(epciCode)
    const longTermVacancyRate = accommodationRates[epciCode].longTermVacancyRate
    const shortTermVacancyRate = accommodationRates[epciCode].shortTermVacancyRate

    let defaultVacancyRate = accommodationRates[epciCode].vacancyRate
    if (type === 'long') {
      defaultVacancyRate = longTermVacancyRate
    } else if (type === 'short') {
      defaultVacancyRate = shortTermVacancyRate
    }
    const targetVacancyRate = await this.getVacantAccommodationRate(scenario, defaultVacancyRate, epciCode, type)

    const result: Record<number, number> = {}

    const minYear = Math.min(peakYear, projection)
    result[baseYear] = defaultVacancyRate

    for (let year = baseYear + 1; year <= projection; year++) {
      if (year <= peakYear) {
        const previousYearRate = result[year - 1]
        const rateChange = (targetVacancyRate - defaultVacancyRate) / (minYear - baseYear)
        result[year] = previousYearRate + rateChange
      } else {
        result[year] = result[peakYear] ?? defaultVacancyRate
      }
    }

    return result
  }

  async getSecondaryResidenceAccomodationEvolutionByEpciAndYear(
    simulation: TSimulationWithEpciAndScenario,
    epciCode: string,
    peakYear: number,
  ): Promise<Record<number, number>> {
    const { baseYear } = this.context
    const periodProjection = simulation.scenario.projection

    const { scenario } = simulation
    const { projection } = scenario
    const data = await this.getFilocomFlux(epciCode)

    const defaultSecondaryResidenceRate = data.txRsParctot
    const targetSecondaryResidenceRate = this.getSecondaryResidenceRate(simulation.scenario, data.txRsParctot, epciCode)

    const result: Record<number, number> = {}

    const minYear = Math.min(peakYear, projection)

    result[baseYear] = defaultSecondaryResidenceRate
    for (let year = baseYear + 1; year <= periodProjection; year++) {
      if (year <= peakYear) {
        const previousYearRate = result[year - 1]
        const rateChange = (targetSecondaryResidenceRate - defaultSecondaryResidenceRate) / (minYear - baseYear)
        result[year] = previousYearRate + rateChange
      } else {
        result[year] = result[peakYear] ?? defaultSecondaryResidenceRate
      }
    }

    return result
  }
}
