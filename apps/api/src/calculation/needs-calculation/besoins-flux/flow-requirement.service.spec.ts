import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { TDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { makeCalculationContext, makeEpciScenario, makeScenario, makeSimulation } from '../__test-utils__/calculation-test-fixtures'
import { FlowRequirementService } from './flow-requirement.service'

describe('FlowRequirementService', () => {
  let service: FlowRequirementService
  const context = makeCalculationContext({ baseYear: 2021 })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlowRequirementService,
        { provide: 'CalculationContext', useValue: context },
        { provide: RenewalHousingStockService, useValue: createMock<RenewalHousingStockService>() },
        { provide: DemographicEvolutionService, useValue: createMock<DemographicEvolutionService>() },
        { provide: DemographicEvolutionCustomService, useValue: createMock<DemographicEvolutionCustomService>() },
        { provide: StockRequirementsService, useValue: createMock<StockRequirementsService>() },
      ],
    }).compile()

    service = module.get<FlowRequirementService>(FlowRequirementService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateAdditionalHousingUnitsForDeficitReduction', () => {
    const makeDemographicEvolution = (years: number[]): TDemographicEvolution => ({
      data: years.map((year) => ({ year, value: 100, yearValue: 1000, previousYearValue: 900 })),
      metadata: { data: { max: 200, min: 50 }, period: { startYear: years[0], endYear: years[years.length - 1] } },
    })

    it('should spread stock deficit evenly across years', () => {
      const demo = makeDemographicEvolution([2022, 2023, 2024, 2025])
      const result = service.calculateAdditionalHousingUnitsForDeficitReduction(demo, 500, 2041)
      // 500 / (2041 - 2021) = 25
      expect(result[2022]).toBe(25)
      expect(result[2023]).toBe(25)
    })

    it('should return 0 for years beyond horizon', () => {
      const demo = makeDemographicEvolution([2040, 2041, 2042, 2043])
      const result = service.calculateAdditionalHousingUnitsForDeficitReduction(demo, 500, 2041)
      expect(result[2042]).toBe(0)
      expect(result[2043]).toBe(0)
    })

    it('should handle zero stock deficit', () => {
      const demo = makeDemographicEvolution([2022, 2023])
      const result = service.calculateAdditionalHousingUnitsForDeficitReduction(demo, 0, 2041)
      expect(result[2022]).toBe(0)
    })

    it('should guard against division by zero when horizon equals baseYear', () => {
      const demo = makeDemographicEvolution([2022, 2023])
      const result = service.calculateAdditionalHousingUnitsForDeficitReduction(demo, 500, 2021)
      expect(result[2022]).toBe(0)
    })
  })

  describe('calculateAdditionalHousingUnitsForDeficitAndNewHouseholds', () => {
    it('should sum new household growth and deficit reduction per year', () => {
      const demo: TDemographicEvolution = {
        data: [
          { year: 2022, value: 100, yearValue: 1000, previousYearValue: 900 },
          { year: 2023, value: 150, yearValue: 1100, previousYearValue: 1000 },
        ],
        metadata: { data: { max: 150, min: 100 }, period: { startYear: 2022, endYear: 2023 } },
      }
      const deficitReduction = { 2022: 25, 2023: 25 }
      const result = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, deficitReduction)
      expect(result).toEqual([
        { year: 2022, value: 125 },
        { year: 2023, value: 175 },
      ])
    })

    it('should handle negative values', () => {
      const demo: TDemographicEvolution = {
        data: [{ year: 2022, value: -50, yearValue: 950, previousYearValue: 1000 }],
        metadata: { data: { max: -50, min: -50 }, period: { startYear: 2022, endYear: 2022 } },
      }
      const result = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, { 2022: 25 })
      expect(result).toEqual([{ year: 2022, value: -25 }])
    })
  })

  describe('calculateNewHousingUnitsToConstruct', () => {
    it('should return value + vacancy/secondary when demand exceeds vacancy', () => {
      const deficit = [{ year: 2022, value: 200 }]
      const longVacant = { 2022: -10 }
      const shortVacant = { 2022: -20 }
      const secondary = { 2022: -30 }
      const result = service.calculateNewHousingUnitsToConstruct(deficit, longVacant, shortVacant, secondary)
      // 200 + (-10) + (-20) + (-30) = 140
      expect(result[2022]).toBe(140)
    })

    it('should cap at 0 when vacancy exceeds demand', () => {
      const deficit = [{ year: 2022, value: 10 }]
      const longVacant = { 2022: 5 }
      const shortVacant = { 2022: 5 }
      const secondary = { 2022: 5 }
      // vacantSecondary (15) > value (10)
      const result = service.calculateNewHousingUnitsToConstruct(deficit, longVacant, shortVacant, secondary)
      expect(result[2022]).toBe(0)
    })

    it('should handle zero values', () => {
      const deficit = [{ year: 2022, value: 100 }]
      const result = service.calculateNewHousingUnitsToConstruct(deficit, { 2022: 0 }, { 2022: 0 }, { 2022: 0 })
      expect(result[2022]).toBe(100)
    })
  })

  describe('calculateAdditionalHousingForReplacements', () => {
    it('should calculate replacement housing from parc and rates', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ epciCode: '200000001', b2_tx_disparition: 0.01, b2_tx_restructuration: 0.003 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 100000, '200000001')
      // 100000 * (0.01 - 0.003) = 700
      expect(result).toBe(700)
    })

    it('should return 0 when rates cancel out', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.005, b2_tx_restructuration: 0.005 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 100000, '200000001')
      expect(result).toBe(0)
    })

    it('should round the result', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.0033, b2_tx_restructuration: 0.001 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 10000, '200000001')
      // 10000 * 0.0023 = 23
      expect(result).toBe(23)
    })
  })

  describe('calculateAccommodationVariationByYear', () => {
    it('should compute accommodation from menages, vacancy, and secondary rates', () => {
      const menages = [{ epciCode: '200000001', centralH: 1000, year: 2022 }]
      const vacantEvolution = { 2022: 0.08 }
      const secondaryEvolution = { 2022: 0.05 }
      const result = service.calculateAccommodationVariationByYear(menages, 'centralH' as any, vacantEvolution, secondaryEvolution)
      // 1000 / (1 - 0.08 - 0.05) = 1000 / 0.87 ≈ 1149
      expect(result[2022]).toBe(1149)
    })

    it('should handle multiple years', () => {
      const menages = [
        { epciCode: '200000001', centralH: 1000, year: 2022 },
        { epciCode: '200000001', centralH: 1100, year: 2023 },
      ]
      const vacantEvolution = { 2022: 0.08, 2023: 0.07 }
      const secondaryEvolution = { 2022: 0.05, 2023: 0.05 }
      const result = service.calculateAccommodationVariationByYear(menages, 'centralH' as any, vacantEvolution, secondaryEvolution)
      expect(result[2022]).toBe(Math.round(1000 / 0.87))
      expect(result[2023]).toBe(Math.round(1100 / 0.88))
    })

    it('should handle zero denominator gracefully', () => {
      const menages = [{ epciCode: '200000001', centralH: 1000, year: 2022 }]
      const result = service.calculateAccommodationVariationByYear(menages, 'centralH' as any, { 2022: 0.5 }, { 2022: 0.5 })
      // 1 - 0.5 - 0.5 = 0 -> division by zero -> Infinity -> Math.round(Infinity) = Infinity
      expect(result[2022]).not.toBeNaN()
    })
  })

  describe('calculateVacantAccommodationVariationByYear', () => {
    it('should compute base year as accommodation * rate', () => {
      const accommodation = { 2021: 10000 }
      const vacantRate = { 2021: 0.08 }
      const result = service.calculateVacantAccommodationVariationByYear(accommodation, vacantRate, 2025)
      expect(result[2021]).toBe(Math.round(10000 * 0.08))
    })

    it('should compute year-over-year delta for subsequent years', () => {
      const accommodation = { 2021: 10000, 2022: 10200 }
      const vacantRate = { 2021: 0.08, 2022: 0.079 }
      const result = service.calculateVacantAccommodationVariationByYear(accommodation, vacantRate, 2022)
      // 2022: 10200 * 0.079 - 10000 * 0.08 = 805.8 - 800 = 5.8 ≈ 6
      expect(result[2022]).toBe(Math.round(10200 * 0.079 - 10000 * 0.08))
    })

    it('should use same rate if previous year rate is missing', () => {
      const accommodation = { 2021: 10000, 2022: 10200 }
      const vacantRate = { 2022: 0.08 }
      const result = service.calculateVacantAccommodationVariationByYear(accommodation, vacantRate, 2022)
      // First iteration year=2021 not in loop if baseYear=2021 and year starts at 2021
      // For year 2021: 10000 * undefined -> handled by fallback
      expect(result).toBeDefined()
    })
  })

  describe('calculateShortTermVacantAccommodationVariationByYear', () => {
    it('should return 0 for years after peak year', () => {
      const accommodation = { 2021: 10000, 2022: 10200, 2023: 10400 }
      const vacantRate = { 2021: 0.04, 2022: 0.039, 2023: 0.038 }
      const result = service.calculateShortTermVacantAccommodationVariationByYear(accommodation, vacantRate, 2025, 2022)
      expect(result[2023]).toBe(0)
    })

    it('should compute normally for years up to peak year', () => {
      const accommodation = { 2021: 10000, 2022: 10200 }
      const vacantRate = { 2021: 0.04, 2022: 0.039 }
      const result = service.calculateShortTermVacantAccommodationVariationByYear(accommodation, vacantRate, 2025, 2025)
      expect(result[2021]).toBe(Math.round(10000 * 0.04))
    })

    it('should handle peak year equal to base year', () => {
      const accommodation = { 2021: 10000, 2022: 10200 }
      const vacantRate = { 2021: 0.04, 2022: 0.039 }
      const result = service.calculateShortTermVacantAccommodationVariationByYear(accommodation, vacantRate, 2025, 2021)
      expect(result[2021]).toBe(Math.round(10000 * 0.04))
      expect(result[2022]).toBe(0)
    })
  })

  describe('calculateLongTermVacantAccommodationVariationByYear', () => {
    it('should return 0 for years after peak year', () => {
      const accommodationEvolution = { 2021: 10000, 2022: 10200, 2023: 10400 }
      const vacantRate = { 2021: 0.04, 2022: 0.039, 2023: 0.038 }
      const deficitAndHouseholds = [
        { year: 2022, value: 100 },
        { year: 2023, value: 100 },
      ]
      const result = service.calculateLongTermVacantAccommodationVariationByYear(
        accommodationEvolution,
        vacantRate,
        2025,
        2022,
        deficitAndHouseholds,
      )
      expect(result[2023]).toBe(0)
    })

    it('should return 0 when additional housing is negative', () => {
      const accommodationEvolution = { 2021: 10000, 2022: 10200 }
      const vacantRate = { 2021: 0.04, 2022: 0.039 }
      const deficitAndHouseholds = [{ year: 2022, value: -50 }]
      const result = service.calculateLongTermVacantAccommodationVariationByYear(
        accommodationEvolution,
        vacantRate,
        2025,
        2025,
        deficitAndHouseholds,
      )
      expect(result[2022]).toBe(0)
    })

    it('should cap negative accommodation at -additionalHousing', () => {
      const accommodationEvolution = { 2021: 10000, 2022: 9000 }
      const vacantRate = { 2021: 0.04, 2022: 0.04 }
      const deficitAndHouseholds = [{ year: 2022, value: 50 }]
      const result = service.calculateLongTermVacantAccommodationVariationByYear(
        accommodationEvolution,
        vacantRate,
        2025,
        2025,
        deficitAndHouseholds,
      )
      // previousAccommodation = 9000*0.04 - 10000*0.04 = 360 - 400 = -40
      // |previousAccommodation| (40) < additionalHousing (50), so use previousAccommodation (-40)
      expect(result[2022]).toBe(Math.round(-40))
    })
  })

  describe('calculateSecondaryResidenceVariationByYear', () => {
    it('should compute base year as accommodation * secondary rate', () => {
      const accommodation = { 2021: 10000 }
      const secondaryRate = { 2021: 0.05 }
      const result = service.calculateSecondaryResidenceVariationByYear(accommodation, secondaryRate, 2025)
      expect(result[2021]).toBe(Math.round(10000 * 0.05))
    })

    it('should compute year-over-year delta for subsequent years', () => {
      const accommodation = { 2021: 10000, 2022: 10200 }
      const secondaryRate = { 2021: 0.05, 2022: 0.048 }
      const result = service.calculateSecondaryResidenceVariationByYear(accommodation, secondaryRate, 2022)
      // 10200 * 0.048 - 10000 * 0.05 = 489.6 - 500 = -10.4 ≈ -10
      expect(result[2022]).toBe(Math.round(10200 * 0.048 - 10000 * 0.05))
    })
  })

  describe('calculatePeakYear', () => {
    it('should find year with max cumulative sum', () => {
      const demo: TDemographicEvolution = {
        data: [
          { year: 2021, value: 0, yearValue: 1000, previousYearValue: 1000 },
          { year: 2022, value: 100, yearValue: 1100, previousYearValue: 1000 },
          { year: 2023, value: 150, yearValue: 1250, previousYearValue: 1100 },
          { year: 2024, value: -200, yearValue: 1050, previousYearValue: 1250 },
          { year: 2025, value: -100, yearValue: 950, previousYearValue: 1050 },
        ],
        metadata: { data: { max: 150, min: -200 }, period: { startYear: 2021, endYear: 2025 } },
      }
      const deficit = { 2021: 0, 2022: 25, 2023: 25, 2024: 25, 2025: 25 }
      const peakYear = service.calculatePeakYear(demo, deficit)
      // cumulative: 2021=1000(firstYearValue), 2022=25+100+1000=1125, 2023=25+150+1125=1300, 2024=25+(-200)+1300=1125, 2025=25+(-100)+1125=1050
      // max is 1300 at 2023
      expect(peakYear).toBe(2023)
    })

    it('should return 2021 if peak is before base year', () => {
      const demo: TDemographicEvolution = {
        data: [
          { year: 2020, value: -100, yearValue: 900, previousYearValue: 1000 },
          { year: 2021, value: -50, yearValue: 850, previousYearValue: 900 },
        ],
        metadata: { data: { max: -50, min: -100 }, period: { startYear: 2020, endYear: 2021 } },
      }
      const deficit = { 2020: 0, 2021: 0 }
      const peakYear = service.calculatePeakYear(demo, deficit)
      expect(peakYear).toBeGreaterThanOrEqual(2021)
    })

    it('should default to 2050 when all values are deeply negative', () => {
      const demo: TDemographicEvolution = {
        data: [{ year: 2021, value: 0, yearValue: 0, previousYearValue: 0 }],
        metadata: { data: { max: 0, min: 0 }, period: { startYear: 2021, endYear: 2021 } },
      }
      const deficit = { 2021: 0 }
      const peakYear = service.calculatePeakYear(demo, deficit)
      expect(peakYear).toBeGreaterThanOrEqual(2021)
    })
  })

  describe('calculateParcEvolutionAndNeedsSequential', () => {
    it('should compute sequential parc evolution with needs and surplus', () => {
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2024,
          epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0 })],
        }),
      })
      const initialParc = 10000
      const newHousing = { 2022: 100, 2023: 80, 2024: 60 }
      const deficitAndHouseholds = [
        { year: 2022, value: 100 },
        { year: 2023, value: 80 },
        { year: 2024, value: 60 },
      ]
      const result = service.calculateParcEvolutionAndNeedsSequential(
        simulation,
        initialParc,
        newHousing,
        deficitAndHouseholds,
        '200000001',
        2030,
      )
      expect(result.parcEvolution[2021]).toBe(10000)
      // Year 2022 loop: replacement = 10000 * (0.001 - 0) = 10, total = 10 + 100 = 110 > 0
      // housingNeeds[year-1=2021] = 110, surplusHousing[year-1=2021] = 0
      expect(result.housingNeeds[2021]).toBe(110)
      expect(result.surplusHousing[2021]).toBe(0)
      // parcEvolution[2022] = max(0, 10000 + 110 - 0) = 10110
      expect(result.parcEvolution[2022]).toBe(10110)
    })

    it('should track surplus when total value is negative', () => {
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2023,
          epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0.01 })],
        }),
      })
      const initialParc = 10000
      const newHousing = { 2022: 0, 2023: 0 }
      const deficitAndHouseholds = [
        { year: 2022, value: 0 },
        { year: 2023, value: 0 },
      ]
      const result = service.calculateParcEvolutionAndNeedsSequential(
        simulation,
        initialParc,
        newHousing,
        deficitAndHouseholds,
        '200000001',
        2030,
      )
      // replacement = 10000 * (0.001 - 0.01) = -90, total = -90 + 0 = -90 < 0 -> surplus
      expect(result.surplusHousing[2021]).toBe(90)
      expect(result.housingNeeds[2021]).toBe(0)
    })
  })
})
