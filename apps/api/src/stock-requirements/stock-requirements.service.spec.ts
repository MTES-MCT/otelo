import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import {
  makeCalculationContext,
  makeEpciScenario,
  makeScenario,
  makeSimulation,
  makeStockRequirementsResults,
} from '../calculation/needs-calculation/__test-utils__/calculation-test-fixtures'
import { StockRequirementsService } from './stock-requirements.service'

describe('StockRequirementsService', () => {
  let service: StockRequirementsService
  let noAccomodationService: DeepMocked<NoAccomodationService>
  let hostedService: DeepMocked<HostedService>
  let financialService: DeepMocked<FinancialInadequationService>
  let badQualityService: DeepMocked<BadQualityService>
  let physicalService: DeepMocked<PhysicalInadequationService>

  const context = makeCalculationContext({ baseYear: 2021 })

  beforeEach(async () => {
    noAccomodationService = createMock<NoAccomodationService>()
    hostedService = createMock<HostedService>()
    financialService = createMock<FinancialInadequationService>()
    badQualityService = createMock<BadQualityService>()
    physicalService = createMock<PhysicalInadequationService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockRequirementsService,
        { provide: 'CalculationContext', useValue: context },
        { provide: NoAccomodationService, useValue: noAccomodationService },
        { provide: HostedService, useValue: hostedService },
        { provide: FinancialInadequationService, useValue: financialService },
        { provide: BadQualityService, useValue: badQualityService },
        { provide: PhysicalInadequationService, useValue: physicalService },
      ],
    }).compile()

    service = module.get<StockRequirementsService>(StockRequirementsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateStock', () => {
    it('should call all 5 sub-services and return aggregated results', async () => {
      const makeResult = (value: number) => ({
        epcis: [{ epciCode: '200000001', value, prorataValue: value }],
        total: value,
        prorataTotal: value,
      })
      noAccomodationService.calculate.mockResolvedValue(makeResult(100))
      hostedService.calculate.mockResolvedValue(makeResult(200))
      financialService.calculate.mockResolvedValue(makeResult(150))
      physicalService.calculate.mockResolvedValue(makeResult(120))
      badQualityService.calculate.mockResolvedValue(makeResult(80))

      const simulation = makeSimulation()
      const result = await service.calculateStock(simulation)

      expect(result.noAccomodation.total).toBe(100)
      expect(result.hosted.total).toBe(200)
      expect(result.financialInadequation.total).toBe(150)
      expect(result.physicalInadequation.total).toBe(120)
      expect(result.badQuality.total).toBe(80)
    })
  })

  describe('calculateStockByEpci', () => {
    it('should sum all category values for a given EPCI', () => {
      const data = makeStockRequirementsResults('200000001')
      const result = service.calculateStockByEpci('200000001', data)
      // 100 + 200 + 150 + 80 + 120 = 650
      expect(result).toBe(650)
    })

    it('should return 0 for unknown EPCI', () => {
      const data = makeStockRequirementsResults('200000001')
      const result = service.calculateStockByEpci('999999999', data)
      expect(result).toBe(0)
    })
  })

  describe('calculateProrataStockByEpci', () => {
    it('should scale values based on peak year and horizon', () => {
      const data = makeStockRequirementsResults('200000001')
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2041,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = service.calculateProrataStockByEpci(simulation, '200000001', data, 2031)
      // horizonDelta = 2041 - 2021 = 20
      // yearsBeforePeak = 10, prePeakYears = min(10, 20) = 10
      // yearsAfterPeak = 10, postPeakYears = min(10, 10) = 10
      // Each value scaled: Math.round(10 * value / 20) = value/2
      // prePeakTotal = 50 + 100 + 75 + 40 + 60 = 325
      expect(result.prePeakTotal).toBe(325)
      // postPeakTotal = 50 + 100 + 75 + 40 + 60 = 325
      expect(result.postPeakTotal).toBe(325)
      expect(result.total).toBe(650)
    })

    it('should use full value when peakYear >= horizon', () => {
      const data = makeStockRequirementsResults('200000001')
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2041,
          b1_horizon_resorption: 2031,
        }),
      })
      const result = service.calculateProrataStockByEpci(simulation, '200000001', data, 2031)
      // horizonDelta = 2031 - 2021 = 10
      // yearsBeforePeak = 10, prePeakYears = min(10, 10) = 10
      // postPeakYears = min(10, max(0, 10-10)) = 0
      // prePeak = round(10 * value / 10) = value → full stock
      expect(result.prePeakTotal).toBe(650)
      expect(result.postPeakTotal).toBe(0)
    })

    it('should handle peakYear of 2021 (no peak)', () => {
      const data = makeStockRequirementsResults('200000001')
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2041,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = service.calculateProrataStockByEpci(simulation, '200000001', data, 2021)
      // yearsBeforePeak = 0, prePeakYears = 0
      // yearsAfterPeak = 20, postPeakYears = min(20, 20) = 20
      expect(result.prePeakTotal).toBe(0)
      expect(result.postPeakTotal).toBe(650)
      expect(result.total).toBe(650)
    })

    it('should return zeros for unknown EPCI', () => {
      const data = makeStockRequirementsResults('200000001')
      const simulation = makeSimulation()
      const result = service.calculateProrataStockByEpci(simulation, '999999999', data, 2031)
      expect(result.prePeakTotal).toBe(0)
      expect(result.postPeakTotal).toBe(0)
    })

    it('should ensure prePeak + postPeak never exceed total stock', () => {
      const data = makeStockRequirementsResults('200000001')
      // horizon = peakYear → all stock resolved pre-peak, none post-peak
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2041,
          b1_horizon_resorption: 2031,
        }),
      })
      const result = service.calculateProrataStockByEpci(simulation, '200000001', data, 2031)
      const totalStock = 650
      expect(result.prePeakTotal + result.postPeakTotal).toBeLessThanOrEqual(totalStock)
      expect(result.prePeakTotal + result.postPeakTotal).toBe(totalStock)
    })

    it('should handle horizon > projection (partial resolution)', () => {
      const data = makeStockRequirementsResults('200000001')
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2041,
          b1_horizon_resorption: 2061,
        }),
      })
      const result = service.calculateProrataStockByEpci(simulation, '200000001', data, 2031)
      // horizonDelta = 2061 - 2021 = 40
      // yearsBeforePeak = 10, prePeakYears = min(10, 40) = 10
      // yearsAfterPeak = 10, postPeakYears = min(10, 30) = 10
      // Each value: round(10 * value / 40) = round(value/4)
      // 25 + 50 + 38 + 20 + 30 = 163
      expect(result.prePeakTotal).toBe(163)
      expect(result.postPeakTotal).toBe(163)
      // Only partial stock resolved since horizon extends beyond projection
      expect(result.total).toBe(326)
      expect(result.total).toBeLessThan(650)
    })

    it('should correctly prorate when projection < peakYear < horizon (no double prorating)', () => {
      const data = makeStockRequirementsResults('200000001')
      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2030,
          b1_horizon_resorption: 2040,
        }),
      })
      const result = service.calculateProrataStockByEpci(simulation, '200000001', data, 2035)
      // horizonDelta = 2040 - 2021 = 19
      // yearsBeforePeak = min(2035, 2030) - 2021 = 9 (capped at projection)
      // yearsAfterPeak = max(0, 2030 - 2035) = 0
      // prePeakYears = min(9, 19) = 9
      // postPeakYears = 0
      // Each value scaled: round(9 * value / 19)
      // round(9*100/19) + round(9*200/19) + round(9*150/19) + round(9*80/19) + round(9*120/19)
      // = 47 + 95 + 71 + 38 + 57 = 308
      expect(result.prePeakTotal).toBe(308)
      expect(result.postPeakTotal).toBe(0)
      expect(result.total).toBe(308)
      // Total should equal the prorated value for the projection period (9/19 of 650)
      // This is the volume for 2021-2030, NOT the full volume (650) or a double-prorated value
      expect(result.total).toBeCloseTo((650 * 9) / 19, -1)
    })

    describe('with production fixture (projection < peakYear < horizon)', () => {
      // Real data from production: 2 EPCIs with different peakYears
      // Scenario: projection=2030 < peakYear(200068757)=2035 < horizon=2050
      const makeFixtureData = () => {
        const makeResult = (epciValues: { epciCode: string; value: number }[]) => ({
          epcis: epciValues.map(({ epciCode, value }) => ({ epciCode, value, prorataValue: value })),
          total: epciValues.reduce((sum, e) => sum + e.value, 0),
          prorataTotal: epciValues.reduce((sum, e) => sum + e.value, 0),
        })

        return {
          noAccomodation: makeResult([
            { epciCode: '200068369', value: 13 },
            { epciCode: '200068757', value: 324 },
          ]),
          hosted: makeResult([
            { epciCode: '200068369', value: 72 },
            { epciCode: '200068757', value: 569 },
          ]),
          financialInadequation: makeResult([
            { epciCode: '200068369', value: 11 },
            { epciCode: '200068757', value: 112 },
          ]),
          badQuality: makeResult([
            { epciCode: '200068369', value: 7 },
            { epciCode: '200068757', value: 35 },
          ]),
          physicalInadequation: makeResult([
            { epciCode: '200068369', value: 0 },
            { epciCode: '200068757', value: 2 },
          ]),
        }
      }

      const fixtureSimulation = makeSimulation({
        epcis: [
          { code: '200068369', name: 'EPCI 1', bassinName: null },
          { code: '200068757', name: 'EPCI 2', bassinName: null },
        ],
        scenario: makeScenario({
          projection: 2030,
          b1_horizon_resorption: 2050,
          epciScenarios: [makeEpciScenario({ epciCode: '200068369' }), makeEpciScenario({ epciCode: '200068757' })],
        }),
      })

      it('should prorate stock for 2021-2030 when projection(2030) < peakYear(2035) < horizon(2050)', () => {
        const data = makeFixtureData()
        // EPCI 200068757: peakYear=2035, projection=2030, horizon=2050
        // horizonDelta = 2050 - 2021 = 29
        // yearsBeforePeak = min(2035, 2030) - 2021 = 9 (capped at projection, not peakYear)
        // yearsAfterPeak = max(0, 2030 - 2035) = 0
        // Each category: round(9 * value / 29)
        //   noAccomodation:        round(9 * 324 / 29) = 101
        //   hosted:                round(9 * 569 / 29) = 177
        //   financialInadequation: round(9 * 112 / 29) = 35
        //   badQuality:            round(9 * 35  / 29) = 11
        //   physicalInadequation:  round(9 * 2   / 29) = 1
        //   prePeakTotal = 101 + 177 + 35 + 11 + 1 = 325
        const result = service.calculateProrataStockByEpci(fixtureSimulation, '200068757', data, 2035)

        expect(result.prePeakTotal).toBe(325)
        expect(result.postPeakTotal).toBe(0)
        expect(result.total).toBe(325)

        // The total stock for this EPCI is 1042 (324+569+112+35+2)
        // For the period 2021-2030 (9 years out of 29), the correct prorata is ~323
        // The old buggy code would give 503 (using peakYear=14 years instead of projection=9 years)
        const totalStockEpci = 324 + 569 + 112 + 35 + 2
        expect(totalStockEpci).toBe(1042)
        expect(result.total).not.toBe(503) // would be 503 with the old double-prorating bug
      })

      it('should handle EPCI with peakYear=2021 (no peak) within the same scenario', () => {
        const data = makeFixtureData()
        // EPCI 200068369: peakYear=2021, projection=2030, horizon=2050
        // yearsBeforePeak = min(2021, 2030) - 2021 = 0
        // yearsAfterPeak = max(0, 2030 - 2021) = 9
        // postPeakYears = min(9, 29) = 9
        // Each category: round(9 * value / 29)
        //   noAccomodation:        round(9 * 13 / 29) = 4
        //   hosted:                round(9 * 72 / 29) = 22
        //   financialInadequation: round(9 * 11 / 29) = 3
        //   badQuality:            round(9 * 7  / 29) = 2
        //   physicalInadequation:  round(9 * 0  / 29) = 0
        //   postPeakTotal = 4 + 22 + 3 + 2 + 0 = 31
        const result = service.calculateProrataStockByEpci(fixtureSimulation, '200068369', data, 2021)

        expect(result.prePeakTotal).toBe(0)
        expect(result.postPeakTotal).toBe(31)
        expect(result.total).toBe(31)
      })
    })
  })
})
