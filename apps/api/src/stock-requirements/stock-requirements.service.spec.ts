import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { NoAccomodationService } from '~/calculation/needs-calculation/besoins-stock/hors-logement-b11/no-accomodation.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { PhysicalInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-physique-b15/physical-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import {
  makeCalculationContext,
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
  })
})
