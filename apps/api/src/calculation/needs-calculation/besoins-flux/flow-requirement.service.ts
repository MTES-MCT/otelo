import { Inject, Injectable } from '@nestjs/common'
import { TFlowRequirementChartData, TFlowRequirementChartDataResult } from '@shared'
import { BaseCalculator, CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import {
  DemographicEvolutionService,
  omphaleMap,
} from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { EOmphale, TDemographicEvolution, TGetDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
import { TStockRequirementsResults } from '~/schemas/results/results'
import { TScenario } from '~/schemas/scenarios/scenario'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'

@Injectable()
export class FlowRequirementService extends BaseCalculator<[TStockRequirementsResults], [TStockRequirementsResults]> {
  constructor(
    @Inject('CalculationContext')
    protected readonly context: CalculationContext,
    private readonly renewalHousingStock: RenewalHousingStockService,
    private readonly demographicEvolutionService: DemographicEvolutionService,
    private readonly demographicEvolutionCustomService: DemographicEvolutionCustomService,
    private readonly stockRequirementsService: StockRequirementsService,
  ) {
    super(context)
  }

  async calculate(
    simulation: TSimulationWithEpciAndScenario,
    stockRequirementsNeeds: TStockRequirementsResults,
  ): Promise<TFlowRequirementChartDataResult> {
    const { epcis } = simulation
    const results = await Promise.all(epcis.map((epci) => this.calculateByEpci(simulation, epci.code, stockRequirementsNeeds)))
    return { epcis: results }
  }

  calculateAdditionalHousingUnitsForDeficitReduction(
    additionalHousingUnitsForNewHouseholds: TDemographicEvolution,
    stockByEpci: number,
    horizon: number,
  ) {
    const { baseYear } = this.context
    const result: Record<number, number> = {}
    additionalHousingUnitsForNewHouseholds.data.forEach(({ year }) => {
      if (year > horizon) {
        result[year] = 0
      } else {
        const calculation = stockByEpci / (horizon - baseYear)
        result[year] = isFinite(calculation) ? Math.round(calculation) : 0
      }
    })

    return result
  }

  calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(
    additionalHousingUnitsForNewHouseholds: TDemographicEvolution,
    additionalHousingUnitsForDeficitReduction: Record<number, number>,
  ) {
    return additionalHousingUnitsForNewHouseholds.data.map(({ year, value }) => {
      return { year, value: value + additionalHousingUnitsForDeficitReduction[year] }
    })
  }

  calculateNewHousingUnitsToConstruct(
    additionalHousingUnitsForDeficitAndNewHouseholds: Array<{ year: number; value: number }>,
    longTermVacantAccomodationVariation: Record<number, number>,
    shortTermVacantAccomodationVariation: Record<number, number>,
    secondaryResidenceAccomodationEvolution: Record<number, number>,
  ) {
    const result: Record<number, number> = {}
    additionalHousingUnitsForDeficitAndNewHouseholds.forEach(({ year, value }) => {
      const vacantSecondary =
        shortTermVacantAccomodationVariation[year] +
        longTermVacantAccomodationVariation[year] +
        secondaryResidenceAccomodationEvolution[year]
      if (vacantSecondary > value) {
        result[year] = 0
      } else {
        result[year] = Math.round(
          value +
            shortTermVacantAccomodationVariation[year] +
            longTermVacantAccomodationVariation[year] +
            secondaryResidenceAccomodationEvolution[year],
        )
      }
    })
    return result
  }

  calculateAdditionalHousingForReplacements(scenario: TScenario, totalParc: number, epciCode: string, otherHousingNeeds: number) {
    const epciScenario = scenario.epciScenarios.find((epci) => epci.epciCode === epciCode)
    const rawReplacement = totalParc * (epciScenario!.b2_tx_disparition - epciScenario!.b2_tx_restructuration)

    if (rawReplacement < 0) {
      if (otherHousingNeeds > 0) {
        return Math.round(Math.max(rawReplacement, -otherHousingNeeds))
      }
      return 0
    }
    return Math.round(rawReplacement)
  }

  calculateAccommodationVariationByYear(
    menagesEvolution: TGetDemographicEvolution[],
    omphale: EOmphale,
    vacantAccomodationEvolution: Record<number, number>,
    secondaryResidenceAccomodationEvolution: Record<number, number>,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    menagesEvolution.forEach(({ year, [omphale]: value }) => {
      const denominator = 1 - vacantAccomodationEvolution[year] - secondaryResidenceAccomodationEvolution[year]
      result[year] = Math.round(Number(value) / denominator)
    })

    return result
  }

  calculateVacantAccommodationVariationByYear(
    accommodationVariation: Record<number, number>,
    vacantAccomodationEvolution: Record<number, number>,
    periodProjection: number,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear } = this.context

    for (let year = baseYear; year <= periodProjection; year++) {
      if (year === baseYear) {
        result[year] = Math.round(accommodationVariation[year] * vacantAccomodationEvolution[year])
      } else {
        const previousAccommodation = accommodationVariation[year - 1] || 0
        const currentVacancyRate = vacantAccomodationEvolution[year]
        const previousVacancyRate = vacantAccomodationEvolution[year - 1] || vacantAccomodationEvolution[year]

        result[year] = Math.round(accommodationVariation[year] * currentVacancyRate - previousAccommodation * previousVacancyRate)
      }
    }

    return result
  }

  calculateShortTermVacantAccommodationVariationByYear(
    accommodationVariation: Record<number, number>,
    vacantAccomodationEvolution: Record<number, number>,
    periodProjection: number,
    peakYear: number,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear } = this.context

    for (let year = baseYear; year <= periodProjection; year++) {
      if (year > peakYear) {
        result[year] = 0
        continue
      }
      if (year === baseYear) {
        result[year] = Math.round(accommodationVariation[year] * vacantAccomodationEvolution[year])
      } else {
        const previousAccommodation = accommodationVariation[year - 1] || 0
        const currentVacancyRate = vacantAccomodationEvolution[year]
        const previousVacancyRate = vacantAccomodationEvolution[year - 1] || vacantAccomodationEvolution[year]

        result[year] = Math.round(accommodationVariation[year] * currentVacancyRate - previousAccommodation * previousVacancyRate)
      }
    }

    return result
  }

  calculateLongTermVacantAccommodationVariationByYear(
    accommodationVariationEvolution: Record<number, number>,
    vacantAccomodationEvolution: Record<number, number>,
    periodProjection: number,
    peakYear: number,
    additionalHousingUnitsForDeficitAndNewHouseholds: {
      year: number
      value: number
    }[],
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear } = this.context

    for (let year = baseYear; year <= periodProjection; year++) {
      if (year > peakYear || year > periodProjection) {
        result[year] = 0
        continue
      }
      const additionalHousing = additionalHousingUnitsForDeficitAndNewHouseholds.find(({ year: y }) => y === year)?.value
      if (additionalHousing) {
        if (additionalHousing < 0) {
          result[year] = 0
          continue
        }
        const previousAccommodation =
          accommodationVariationEvolution[year] * vacantAccomodationEvolution[year] -
            accommodationVariationEvolution[year - 1] * vacantAccomodationEvolution[year - 1] || 0

        let accommodation = 0
        if (previousAccommodation > 0) {
          accommodation = Math.round(previousAccommodation)
        } else {
          accommodation = Math.abs(previousAccommodation) > additionalHousing ? -additionalHousing : previousAccommodation
        }
        result[year] = Math.round(accommodation)
      }
    }

    return result
  }

  calculateSecondaryResidenceVariationByYear(
    accommodationVariation: Record<number, number>,
    secondaryResidenceAccomodationEvolution: Record<number, number>,
    periodProjection: number,
  ): Record<number, number> {
    const result: Record<number, number> = {}
    const { baseYear } = this.context

    for (let year = baseYear; year <= periodProjection; year++) {
      if (year === baseYear) {
        result[year] = Math.round(accommodationVariation[year] * secondaryResidenceAccomodationEvolution[year])
      } else {
        const previousAccommodation = accommodationVariation[year - 1] || 0
        const currentSecondaryResidenceRate = secondaryResidenceAccomodationEvolution[year]
        const previousSecondaryResidenceRate =
          secondaryResidenceAccomodationEvolution[year - 1] || secondaryResidenceAccomodationEvolution[year]

        result[year] = Math.round(
          accommodationVariation[year] * currentSecondaryResidenceRate - previousAccommodation * previousSecondaryResidenceRate,
        )
      }
    }

    return result
  }

  calculateParcEvolutionAndNeedsSequential(
    simulation: TSimulationWithEpciAndScenario,
    initialParc: number,
    newHousingUnitsToConstruct: Record<number, number>,
    additionalHousingUnitsForDeficitAndNewHouseholds: Array<{ year: number; value: number }>,
    epciCode: string,
    peakYear: number,
  ): {
    parcEvolution: Record<number, number>
    housingNeeds: Record<number, number>
    surplusHousing: Record<number, number>
    additionalHousingForReplacements: Record<number, number>
  } {
    const { baseYear } = this.context
    const periodProjection = simulation.scenario.projection

    const parcEvolution: Record<number, number> = {}
    const housingNeeds: Record<number, number> = {}
    const surplusHousing: Record<number, number> = {}
    const additionalHousingForReplacements: Record<number, number> = {}

    parcEvolution[baseYear] = initialParc
    housingNeeds[baseYear] = 0
    surplusHousing[baseYear] = 0
    additionalHousingForReplacements[baseYear] = 0

    for (let year = baseYear + 1; year <= periodProjection; year++) {
      const previousParc = parcEvolution[year - 1]

      let otherHousingNeeds: number
      if (year <= peakYear) {
        otherHousingNeeds = newHousingUnitsToConstruct[year] || 0
      } else {
        otherHousingNeeds = additionalHousingUnitsForDeficitAndNewHouseholds.find(({ year: y }) => y === year)?.value || 0
      }

      additionalHousingForReplacements[year] = this.calculateAdditionalHousingForReplacements(
        simulation.scenario,
        previousParc,
        epciCode,
        otherHousingNeeds,
      )

      const totalValue = additionalHousingForReplacements[year] + otherHousingNeeds
      if (totalValue > 0) {
        housingNeeds[year - 1] = Math.round(totalValue)
        surplusHousing[year - 1] = 0
      } else {
        housingNeeds[year - 1] = 0
        surplusHousing[year - 1] = Math.abs(Math.round(totalValue))
      }

      const netChange = housingNeeds[year - 1] - surplusHousing[year - 1]
      parcEvolution[year] = Math.max(0, previousParc + netChange)
    }

    return { parcEvolution, housingNeeds, surplusHousing, additionalHousingForReplacements }
  }

  formatDemographicEvolutionCustom(
    demographicEvolutionCustom: NonNullable<Awaited<ReturnType<DemographicEvolutionCustomService['findFirstByScenarioAndEpci']>>>,
    omphale: EOmphale,
  ): TGetDemographicEvolution[] {
    const data = demographicEvolutionCustom.data as Array<{ year: number; value: number }>

    return data.map(({ year, value }) => ({
      epciCode: demographicEvolutionCustom.epciCode,
      [omphale]: value,
      year,
    }))
  }

  async getEpciMenageEvolution(
    epciCode: string,
    scenarioId: string,
    scenarioProjection: number,
    omphale: EOmphale,
  ): Promise<TGetDemographicEvolution[]> {
    let menagesEvolution: TGetDemographicEvolution[] = []

    const demographicEvolutionCustom = await this.demographicEvolutionCustomService.findFirstByScenarioAndEpci(scenarioId, epciCode)
    if (demographicEvolutionCustom) {
      menagesEvolution = this.formatDemographicEvolutionCustom(demographicEvolutionCustom, omphale)
    }

    if (!demographicEvolutionCustom) {
      menagesEvolution = await this.demographicEvolutionService.getProjectionsByOmphale(
        {
          epciCode,
          omphale,
        },
        scenarioProjection,
      )
    }

    return menagesEvolution
  }

  calculatePeakYear(
    additionalHousingUnitsForNewHouseholds: TDemographicEvolution,
    additionalHousingUnitsForDeficitReduction: Record<number, number>,
  ) {
    // todo - get millesime
    const firstYearValue = additionalHousingUnitsForNewHouseholds.data.find(({ year }) => year === 2021)?.yearValue || 0

    const { peakYear } = additionalHousingUnitsForNewHouseholds.data.reduce(
      (acc, { year, value }) => {
        const deficitValue = additionalHousingUnitsForDeficitReduction[year] || 0
        let currentSum = acc.previousSum
        if (year > 2021) {
          currentSum = deficitValue + value + acc.previousSum
        }

        if (currentSum > acc.maxSum) {
          acc.maxSum = currentSum
          acc.peakYear = year
        }

        acc.previousSum = currentSum
        return acc
      },
      { maxSum: -Infinity, peakYear: 2050, previousSum: firstYearValue },
    )

    return peakYear < 2021 ? 2021 : peakYear
  }

  async calculateByEpci(
    simulation: TSimulationWithEpciAndScenario,
    epciCode: string,
    stockRequirementsNeeds: TStockRequirementsResults,
  ): Promise<TFlowRequirementChartData> {
    const { baseYear } = this.context
    const { scenario } = simulation
    const totalParc = await this.renewalHousingStock.getFilocomFlux(epciCode)
    const stockByEpci = this.stockRequirementsService.calculateStockByEpci(epciCode, stockRequirementsNeeds)

    const omphale = omphaleMap[scenario.b2_scenario.toLowerCase()]

    const menagesEvolution = await this.getEpciMenageEvolution(epciCode, scenario.id, scenario.projection, omphale)

    // We want to get value from 2021, so we start the calculation one year before, i.e. 2020
    const additionalHousingUnitsForNewHouseholds = await this.demographicEvolutionService.calculateOmphaleProjectionsByYearAndEpci(
      menagesEvolution,
      simulation,
      baseYear - 1,
    )

    const additionalHousingUnitsForDeficitReduction = this.calculateAdditionalHousingUnitsForDeficitReduction(
      additionalHousingUnitsForNewHouseholds,
      stockByEpci,
      simulation.scenario.b1_horizon_resorption,
    )

    const additionalHousingUnitsForDeficitAndNewHouseholds = this.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(
      additionalHousingUnitsForNewHouseholds,
      additionalHousingUnitsForDeficitReduction,
    )

    const peakYear = this.calculatePeakYear(additionalHousingUnitsForNewHouseholds, additionalHousingUnitsForDeficitReduction)

    const vacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(
      scenario,
      epciCode,
      peakYear,
    )
    const shortTermVacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(
      scenario,
      epciCode,
      peakYear,
      'short',
    )
    const longTermVacantAccomodationEvolution = await this.renewalHousingStock.getVacantAccomodationEvolutionByEpciAndYear(
      scenario,
      epciCode,
      peakYear,
      'long',
    )
    const secondaryResidenceAccomodationEvolution = await this.renewalHousingStock.getSecondaryResidenceAccomodationEvolutionByEpciAndYear(
      simulation,
      epciCode,
      peakYear,
    )

    const accommodationVariationEvolution = this.calculateAccommodationVariationByYear(
      // we dont want to use the cumulative deficit reduction for now but i keep it if needed
      // additionalHousingUnitsForDeficitReduction,
      menagesEvolution,
      omphale,
      vacantAccomodationEvolution,
      secondaryResidenceAccomodationEvolution,
    )
    const vacantAccommodationVariation = this.calculateVacantAccommodationVariationByYear(
      accommodationVariationEvolution,
      vacantAccomodationEvolution,
      simulation.scenario.projection,
    )
    const shortTermVacantAccomodationVariation = this.calculateShortTermVacantAccommodationVariationByYear(
      accommodationVariationEvolution,
      shortTermVacantAccomodationEvolution,
      simulation.scenario.projection,
      peakYear,
    )

    const longTermVacantAccomodationVariation = this.calculateLongTermVacantAccommodationVariationByYear(
      accommodationVariationEvolution,
      longTermVacantAccomodationEvolution,
      simulation.scenario.projection,
      peakYear,
      additionalHousingUnitsForDeficitAndNewHouseholds,
    )

    const secondaryResidenceVariation = this.calculateSecondaryResidenceVariationByYear(
      accommodationVariationEvolution,
      secondaryResidenceAccomodationEvolution,
      simulation.scenario.projection,
    )
    const newHousingUnitsToConstruct = this.calculateNewHousingUnitsToConstruct(
      additionalHousingUnitsForDeficitAndNewHouseholds,
      longTermVacantAccomodationVariation,
      shortTermVacantAccomodationVariation,
      secondaryResidenceVariation,
    )

    const { parcEvolution, housingNeeds, surplusHousing, additionalHousingForReplacements } = this.calculateParcEvolutionAndNeedsSequential(
      simulation,
      totalParc.parctot,
      newHousingUnitsToConstruct,
      additionalHousingUnitsForDeficitAndNewHouseholds,
      epciCode,
      peakYear,
    )

    const demographicEvolutionTotal = additionalHousingUnitsForNewHouseholds.data
      .filter(({ year }) => year <= peakYear && year > baseYear)
      .reduce((sum, { value }) => sum + value, 0)
    const renewalNeedsTotal = Object.entries(additionalHousingForReplacements)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const secondaryResidenceTotal = Object.entries(secondaryResidenceVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const housingNeedsTotal = Object.entries(housingNeeds)
      .filter(([year]) => Number(year) <= peakYear && Number(year) >= baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const surplusHousingTotal = Object.entries(surplusHousing).reduce((sum, [, value]) => sum + value, 0)
    const vacantAccomodationTotal = Object.entries(vacantAccommodationVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const shortTermVacantAccomodationTotal = Object.entries(shortTermVacantAccomodationVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)
    const longTermVacantAccomodationTotal = Object.entries(longTermVacantAccomodationVariation)
      .filter(([year]) => Number(year) <= peakYear && Number(year) > baseYear)
      .reduce((sum, [, value]) => sum + value, 0)

    return {
      code: epciCode,
      data: {
        peakYear,
        parcEvolution,
        housingNeeds,
        surplusHousing,
      },
      totals: {
        demographicEvolution: Math.round(demographicEvolutionTotal),
        renewalNeeds: Math.round(renewalNeedsTotal),
        secondaryResidenceAccomodationEvolution: Math.round(secondaryResidenceTotal),
        housingNeeds: Math.round(housingNeedsTotal),
        surplusHousing: Math.round(surplusHousingTotal),
        vacantAccomodation: Math.round(vacantAccomodationTotal),
        shortTermVacantAccomodation: Math.round(shortTermVacantAccomodationTotal),
        longTermVacantAccomodation: Math.round(longTermVacantAccomodationTotal),
      },
      metadata: {
        max: additionalHousingUnitsForNewHouseholds.metadata.period.endYear,
        min: additionalHousingUnitsForNewHouseholds.metadata.period.startYear,
      },
    }
  }
}
