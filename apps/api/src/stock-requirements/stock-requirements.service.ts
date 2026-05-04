import { Inject, Injectable } from '@nestjs/common'
import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { TStockRequirementsResults } from '~/schemas/results/results'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

@Injectable()
export class StockRequirementsService {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly noAccomodationService: NoAccomodationService,
    private readonly hostedService: HostedService,
    private readonly financialInadequationService: FinancialInadequationService,
    private readonly badQualityService: BadQualityService,
    private readonly physicalInadequationService: PhysicalInadequationService,
  ) {}

  async calculateStock(simulation: TSimulationWithEpciAndScenario): Promise<TStockRequirementsResults> {
    const [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality] = await Promise.all([
      this.noAccomodationService.calculate(simulation),
      this.hostedService.calculate(simulation),
      this.financialInadequationService.calculate(simulation),
      this.physicalInadequationService.calculate(simulation),
      this.badQualityService.calculate(simulation),
    ])
    return { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality }
  }

  calculateStockByEpci(epciCode: string, data: TStockRequirementsResults) {
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality } = data
    const categories = [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality]

    return categories.reduce((total, category) => {
      const epciResult = category.epcis.find((e) => e.epciCode === epciCode)
      return total + (epciResult?.value ?? 0)
    }, 0)
  }

  calculateNoAccommodationByEpci(epciCode: string, data: TStockRequirementsResults) {
    const { noAccomodation, hosted } = data
    const categories = [noAccomodation, hosted]

    return categories.reduce((total, category) => {
      const epciResult = category.epcis.find((e) => e.epciCode === epciCode)
      return total + (epciResult?.value ?? 0)
    }, 0)
  }

  calculateProrataStockByEpci(
    simulation: TSimulationWithEpciAndScenario,
    epciCode: string,
    data: TStockRequirementsResults,
    peakYear: number,
  ) {
    const { noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality } = data
    const categories = [noAccomodation, hosted, financialInadequation, physicalInadequation, badQuality]
    const { baseYear } = this.context
    const { projection, b1_horizon_resorption: horizon } = simulation.scenario

    const horizonDelta = horizon - baseYear
    const safeDenominator = horizonDelta > 0 ? horizonDelta : 1

    const computeScaledValue = (value: number, years: number) => {
      if (horizonDelta <= 0) return Math.round(value)
      return Math.round((Math.max(years, 0) * value) / safeDenominator)
    }

    const { prePeakTotal, postPeakTotal } = categories.reduce(
      (acc, category) => {
        const epciResult = category.epcis.find((e) => e.epciCode === epciCode)
        if (!epciResult) {
          return acc
        }

        const yearsBeforePeak = Math.min(peakYear, projection) - baseYear
        const yearsAfterPeak = Math.max(0, projection - peakYear)

        const prePeakYears = Math.min(yearsBeforePeak, horizonDelta)
        const postPeakYears = Math.min(yearsAfterPeak, Math.max(0, horizonDelta - prePeakYears))

        const baseValue = epciResult.value
        const prePeakValue = computeScaledValue(baseValue, prePeakYears)
        const postPeakValue = computeScaledValue(baseValue, postPeakYears)

        return {
          prePeakTotal: acc.prePeakTotal + prePeakValue,
          postPeakTotal: acc.postPeakTotal + postPeakValue,
        }
      },
      { prePeakTotal: 0, postPeakTotal: 0 },
    )

    return {
      total: prePeakTotal + postPeakTotal,
      prePeakTotal,
      postPeakTotal,
    }
  }
}
