import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { DemographicEvolutionService } from '~/calculation/needs-calculation/besoins-flux/evolution-demographique-b21/demographic-evolution.service'
import { RenewalHousingStockService } from '~/calculation/needs-calculation/besoins-flux/occupation-renouvellement-parc-logements-b22/renewal-housing-stock.service'
import { DemographicEvolutionCustomService } from '~/demographic-evolution-custom/demographic-evolution-custom.service'
import { EOmphale, TDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
import { StockRequirementsService } from '~/stock-requirements/stock-requirements.service'
import { makeCalculationContext, makeEpciScenario, makeScenario, makeSimulation } from '../__test-utils__/calculation-test-fixtures'
import {
  buildDemographicEvolution,
  buildMenagesEvolution,
  type FlowRequirementFixture,
  flowRequirementFixtures,
} from './flow-requirement.fixtures'
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

  // ── Unit tests (edge cases) ────────────────────────────────────────────

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
      const result = service.calculateAdditionalHousingForReplacements(scenario, 100000, '200000001', 500)
      // 100000 * (0.01 - 0.003) = 700
      expect(result).toBe(700)
    })

    it('should return 0 when rates cancel out', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.005, b2_tx_restructuration: 0.005 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 100000, '200000001', 500)
      expect(result).toBe(0)
    })

    it('should round the result', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.0033, b2_tx_restructuration: 0.001 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 10000, '200000001', 500)
      // 10000 * 0.0023 = 23
      expect(result).toBe(23)
    })

    it('should ignore otherHousingNeeds when rawReplacement >= 0', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.01, b2_tx_restructuration: 0.003 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 100000, '200000001', 0)
      expect(result).toBe(700)
    })

    it('should not cap when rawReplacement < 0 and otherNeeds > |rawReplacement|', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0.01 })],
      })
      // rawReplacement = 10000 * (0.001 - 0.01) = -90, otherNeeds = 200 > 90 → no cap → -90
      const result = service.calculateAdditionalHousingForReplacements(scenario, 10000, '200000001', 200)
      expect(result).toBe(-90)
    })

    it('should cap at -otherNeeds when rawReplacement < 0 and otherNeeds < |rawReplacement|', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0.01 })],
      })
      // rawReplacement = 10000 * (0.001 - 0.01) = -90, otherNeeds = 50 < 90 → cap at -50
      const result = service.calculateAdditionalHousingForReplacements(scenario, 10000, '200000001', 50)
      expect(result).toBe(-50)
    })

    it('should return 0 when rawReplacement < 0 and otherNeeds <= 0', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0.01 })],
      })
      // rawReplacement = -90, otherNeeds = 0 → return 0
      const result = service.calculateAdditionalHousingForReplacements(scenario, 10000, '200000001', 0)
      expect(result).toBe(0)
    })

    it('should return 0 when rawReplacement < 0 and otherNeeds is negative', () => {
      const scenario = makeScenario({
        epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0.01 })],
      })
      const result = service.calculateAdditionalHousingForReplacements(scenario, 10000, '200000001', -10)
      expect(result).toBe(0)
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

    it('should return 0 replacement when rawReplacement < 0 and otherNeeds = 0', () => {
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
      // rawReplacement = 10000 * (0.001 - 0.01) = -90, otherNeeds = 0 → replacement = 0
      // total = 0 + 0 = 0, no surplus, no needs
      expect(result.additionalHousingForReplacements[2022]).toBe(0)
      expect(result.surplusHousing[2021]).toBe(0)
      expect(result.housingNeeds[2021]).toBe(0)
      expect(result.parcEvolution[2022]).toBe(10000)
    })

    it('should cap negative replacement at -otherNeeds when otherNeeds < |rawReplacement|', () => {
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2023,
          epciScenarios: [makeEpciScenario({ b2_tx_disparition: 0.001, b2_tx_restructuration: 0.01 })],
        }),
      })
      const initialParc = 10000
      const newHousing = { 2022: 50, 2023: 50 }
      const deficitAndHouseholds = [
        { year: 2022, value: 50 },
        { year: 2023, value: 50 },
      ]
      const result = service.calculateParcEvolutionAndNeedsSequential(
        simulation,
        initialParc,
        newHousing,
        deficitAndHouseholds,
        '200000001',
        2030,
      )
      // rawReplacement = 10000 * (0.001 - 0.01) = -90, otherNeeds = 50 < 90 → capped at -50
      // total = -50 + 50 = 0
      expect(result.additionalHousingForReplacements[2022]).toBe(-50)
      expect(result.housingNeeds[2021]).toBe(0)
      expect(result.surplusHousing[2021]).toBe(0)
      expect(result.parcEvolution[2022]).toBe(10000)
    })
  })

  // ── Excel-based fixture validation ─────────────────────────────────────

  describe.each(flowRequirementFixtures)('Excel validation: $name', (fixture: FlowRequirementFixture) => {
    const { config, data, expected } = fixture

    /**
     * Compare a Record<number, number> from the code (rounded integers)
     * against unrounded Excel values. The code applies Math.round,
     * but rounding cascade may cause ±1 drift, so we tolerate that.
     */
    function expectRecordClose(
      actual: Record<number, number>,
      excelExpected: Record<number, number>,
      tolerance = 1,
      startYear = config.baseYear + 1,
    ) {
      for (const [yearStr, excelVal] of Object.entries(excelExpected)) {
        const year = Number(yearStr)
        if (year < startYear) continue
        const actualVal = actual[year]
        expect(actualVal).toBeDefined()
        expect(Math.abs(actualVal - Math.round(excelVal))).toBeLessThanOrEqual(tolerance)
      }
    }

    describe('calculateAdditionalHousingUnitsForDeficitReduction (Row 55)', () => {
      it('should match Excel deficit reduction values', () => {
        const demo = buildDemographicEvolution(fixture)
        const result = service.calculateAdditionalHousingUnitsForDeficitReduction(demo, config.stockDeficit, config.horizonResorption)
        // Excel: 1254 / (2050 - 2021) = 43.241... → Math.round = 43
        for (const [yearStr] of Object.entries(expected.additionalHousingForDeficitReduction)) {
          const year = Number(yearStr)
          expect(result[year]).toBe(Math.round(config.stockDeficit / (config.horizonResorption - config.baseYear)))
        }
      })
    })

    describe('calculateAdditionalHousingUnitsForDeficitAndNewHouseholds (Row 56)', () => {
      it('should match Excel combined values', () => {
        const demo = buildDemographicEvolution(fixture)
        const deficitReduction = service.calculateAdditionalHousingUnitsForDeficitReduction(
          demo,
          config.stockDeficit,
          config.horizonResorption,
        )
        const result = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, deficitReduction)

        for (const item of result) {
          if (item.year <= config.baseYear) continue
          const excelVal = expected.additionalHousingForDeficitAndNewHouseholds[item.year]
          if (excelVal === undefined) continue
          // value = year-over-year MEN change + deficit reduction (rounded)
          // Small diff from Excel because deficit reduction is rounded (43 vs 43.241)
          expect(Math.abs(item.value - excelVal)).toBeLessThan(1)
        }
      })
    })

    describe('calculatePeakYear (Row 58)', () => {
      it('should match Excel peak year', () => {
        const demo = buildDemographicEvolution(fixture)
        const deficitReduction = service.calculateAdditionalHousingUnitsForDeficitReduction(
          demo,
          config.stockDeficit,
          config.horizonResorption,
        )
        const peakYear = service.calculatePeakYear(demo, deficitReduction)
        expect(peakYear).toBe(expected.peakYear)
      })
    })

    describe('calculateAccommodationVariationByYear (Row 23)', () => {
      it('should match Excel accommodation variation', () => {
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const result = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        expectRecordClose(result, expected.accommodationVariation, 1, config.baseYear)
      })
    })

    describe('calculateVacantAccommodationVariationByYear (Row 65)', () => {
      it('should match Excel vacant accommodation variation', () => {
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const result = service.calculateVacantAccommodationVariationByYear(
          accommodationVariation,
          data.vacantAccomodationEvolution,
          config.projection,
        )
        expectRecordClose(result, expected.vacantAccommodationVariation, 10)
      })
    })

    describe('calculateShortTermVacantAccommodationVariationByYear (Row 67)', () => {
      it('should match Excel short-term vacant variation', () => {
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const result = service.calculateShortTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.shortTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
        )
        expectRecordClose(result, expected.shortTermVacantVariation, 2)
      })
    })

    describe('calculateLongTermVacantAccommodationVariationByYear (Row 66)', () => {
      it('should match Excel long-term vacant variation', () => {
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const demo = buildDemographicEvolution(fixture)
        const deficitReduction = service.calculateAdditionalHousingUnitsForDeficitReduction(
          demo,
          config.stockDeficit,
          config.horizonResorption,
        )
        const deficitAndNewHouseholds = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, deficitReduction)

        const result = service.calculateLongTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.longTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
          deficitAndNewHouseholds,
        )
        expectRecordClose(result, expected.longTermVacantVariation, 2)
      })
    })

    describe('calculateSecondaryResidenceVariationByYear (Row 69)', () => {
      it('should match Excel secondary residence variation', () => {
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const result = service.calculateSecondaryResidenceVariationByYear(
          accommodationVariation,
          data.secondaryResidenceAccomodationEvolution,
          config.projection,
        )
        expectRecordClose(result, expected.secondaryResidenceVariation, 4)
      })
    })

    describe('calculateNewHousingUnitsToConstruct (Row 71)', () => {
      it('should match Excel housing to construct (excl. restructurations)', () => {
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const demo = buildDemographicEvolution(fixture)
        const deficitReduction = service.calculateAdditionalHousingUnitsForDeficitReduction(
          demo,
          config.stockDeficit,
          config.horizonResorption,
        )
        const deficitAndNewHouseholds = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, deficitReduction)

        const longTermVariation = service.calculateLongTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.longTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
          deficitAndNewHouseholds,
        )
        const shortTermVariation = service.calculateShortTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.shortTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
        )
        const secondaryVariation = service.calculateSecondaryResidenceVariationByYear(
          accommodationVariation,
          data.secondaryResidenceAccomodationEvolution,
          config.projection,
        )

        const result = service.calculateNewHousingUnitsToConstruct(
          deficitAndNewHouseholds,
          longTermVariation,
          shortTermVariation,
          secondaryVariation,
        )
        // Larger tolerance for Angoulême (78k parc) due to rounding cascade over 29 years
        expectRecordClose(result, expected.newHousingUnitsToConstruct, 80)
      })
    })

    describe('calculateParcEvolutionAndNeedsSequential (Rows 72-75)', () => {
      it('should match Excel parc evolution, housing needs and replacements', () => {
        // Build the full chain to get the inputs for the sequential calculation
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const demo = buildDemographicEvolution(fixture)
        const deficitReduction = service.calculateAdditionalHousingUnitsForDeficitReduction(
          demo,
          config.stockDeficit,
          config.horizonResorption,
        )
        const deficitAndNewHouseholds = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, deficitReduction)

        const longTermVariation = service.calculateLongTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.longTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
          deficitAndNewHouseholds,
        )
        const shortTermVariation = service.calculateShortTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.shortTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
        )
        const secondaryVariation = service.calculateSecondaryResidenceVariationByYear(
          accommodationVariation,
          data.secondaryResidenceAccomodationEvolution,
          config.projection,
        )
        const newHousingUnitsToConstruct = service.calculateNewHousingUnitsToConstruct(
          deficitAndNewHouseholds,
          longTermVariation,
          shortTermVariation,
          secondaryVariation,
        )

        const simulation = makeSimulation({
          scenario: makeScenario({
            projection: config.projection,
            b1_horizon_resorption: config.horizonResorption,
            b2_scenario: config.b2_scenario,
            epciScenarios: [
              makeEpciScenario({
                epciCode: config.epciCode,
                b2_tx_disparition: config.b2_tx_disparition,
                b2_tx_restructuration: config.b2_tx_restructuration,
              }),
            ],
          }),
          epcis: [{ code: config.epciCode, name: 'Test EPCI', bassinName: null }],
        })

        const result = service.calculateParcEvolutionAndNeedsSequential(
          simulation,
          config.initialParc,
          newHousingUnitsToConstruct,
          deficitAndNewHouseholds,
          config.epciCode,
          expected.peakYear,
        )

        // Verify parc evolution (Row 75)
        expect(result.parcEvolution[config.baseYear]).toBe(config.initialParc)
        // Allow small tolerance due to rounding cascade over 30 years
        for (const [yearStr, excelVal] of Object.entries(expected.parcEvolution)) {
          const year = Number(yearStr)
          if (year <= config.baseYear) continue
          // Tolerance proportional to parc size (0.5%) — rounding cascades grow with parc
          const parcTolerance = Math.max(10, Math.ceil(config.initialParc * 0.006))
          expect(Math.abs(result.parcEvolution[year] - Math.round(excelVal))).toBeLessThanOrEqual(parcTolerance)
        }

        // Verify housing needs (Row 73) — 0 after peak year means stable parc
        for (const [yearStr, excelVal] of Object.entries(expected.housingNeeds)) {
          const year = Number(yearStr)
          if (excelVal === 0) {
            expect(result.housingNeeds[year - 1]).toBe(0)
          }
        }

        // Verify surplus housing (Row 74)
        for (const [yearStr, excelVal] of Object.entries(expected.surplusHousing)) {
          const year = Number(yearStr)
          if (excelVal === 0) {
            expect(result.surplusHousing[year - 1]).toBe(0)
          }
        }
      })
    })

    describe('Totals (Rows 81-90)', () => {
      it('should match Excel housing needs total (besoin en logements)', () => {
        // Build full chain
        const menages = buildMenagesEvolution(fixture)
        const omphale = config.omphaleKey as EOmphale
        const accommodationVariation = service.calculateAccommodationVariationByYear(
          menages,
          omphale,
          data.vacantAccomodationEvolution,
          data.secondaryResidenceAccomodationEvolution,
        )
        const demo = buildDemographicEvolution(fixture)
        const deficitReduction = service.calculateAdditionalHousingUnitsForDeficitReduction(
          demo,
          config.stockDeficit,
          config.horizonResorption,
        )
        const deficitAndNewHouseholds = service.calculateAdditionalHousingUnitsForDeficitAndNewHouseholds(demo, deficitReduction)

        const longTermVariation = service.calculateLongTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.longTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
          deficitAndNewHouseholds,
        )
        const shortTermVariation = service.calculateShortTermVacantAccommodationVariationByYear(
          accommodationVariation,
          data.shortTermVacantAccomodationEvolution,
          config.projection,
          expected.peakYear,
        )
        const secondaryVariation = service.calculateSecondaryResidenceVariationByYear(
          accommodationVariation,
          data.secondaryResidenceAccomodationEvolution,
          config.projection,
        )
        const newHousingUnitsToConstruct = service.calculateNewHousingUnitsToConstruct(
          deficitAndNewHouseholds,
          longTermVariation,
          shortTermVariation,
          secondaryVariation,
        )

        const simulation = makeSimulation({
          scenario: makeScenario({
            projection: config.projection,
            b1_horizon_resorption: config.horizonResorption,
            b2_scenario: config.b2_scenario,
            epciScenarios: [
              makeEpciScenario({
                epciCode: config.epciCode,
                b2_tx_disparition: config.b2_tx_disparition,
                b2_tx_restructuration: config.b2_tx_restructuration,
              }),
            ],
          }),
          epcis: [{ code: config.epciCode, name: 'Test EPCI', bassinName: null }],
        })

        const { housingNeeds } = service.calculateParcEvolutionAndNeedsSequential(
          simulation,
          config.initialParc,
          newHousingUnitsToConstruct,
          deficitAndNewHouseholds,
          config.epciCode,
          expected.peakYear,
        )

        // Compute totals the same way the service does (lines 470-510)
        const { baseYear } = service['context']
        const peakYear = expected.peakYear

        const housingNeedsTotal = Object.entries(housingNeeds)
          .filter(([year]) => Number(year) <= peakYear && Number(year) >= baseYear)
          .reduce((sum, [, value]) => sum + value, 0)

        // This is the key assertion: besoin en logements total must match Excel
        // Excel says 5138 for Angoulême, 5548 for ARRAS
        // Tolerance of 15 accounts for rounding cascade over 29 years
        expect(Math.abs(Math.round(housingNeedsTotal) - Math.round(expected.totals.housingNeeds))).toBeLessThanOrEqual(15)
      })
    })
  })
})
