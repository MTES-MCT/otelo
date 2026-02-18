import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { PrismaService } from '~/db/prisma.service'
import { makeCalculationContext, makeEpciScenario, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { RenewalHousingStockService } from './renewal-housing-stock.service'

describe('RenewalHousingStockService', () => {
  let service: RenewalHousingStockService
  let prisma: DeepMocked<PrismaService>
  let accommodationRatesService: DeepMocked<AccommodationRatesService>

  const context = makeCalculationContext({ baseYear: 2021 })

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    accommodationRatesService = createMock<AccommodationRatesService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenewalHousingStockService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccommodationRatesService, useValue: accommodationRatesService },
        { provide: 'CalculationContext', useValue: context },
      ],
    }).compile()

    service = module.get<RenewalHousingStockService>(RenewalHousingStockService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getVacantAccomodationEvolutionByEpciAndYear', () => {
    const setupAccommodationRates = (vacancyRate = 0.08, shortTermRate = 0.04, longTermRate = 0.04) => {
      accommodationRatesService.getAccommodationRates.mockResolvedValue({
        '200000001': { vacancyRate, shortTermVacancyRate: shortTermRate, longTermVacancyRate: longTermRate },
      } as any)
    }

    it('should linearly interpolate vacancy rate from base year to peak year', async () => {
      setupAccommodationRates(0.08)
      const scenario = makeScenario({
        projection: 2025,
        epciScenarios: [makeEpciScenario({ b2_tx_vacance_courte: 0.04, b2_tx_vacance_longue: 0.04 })],
      })
      const result = await service.getVacantAccomodationEvolutionByEpciAndYear(scenario, '200000001', 2025)
      // Default rate = 0.08, target = 0.04+0.04 = 0.08 (same), so no change
      expect(result[2021]).toBe(0.08)
      expect(result[2025]).toBeCloseTo(0.08)
    })

    it('should keep rate flat after peak year', async () => {
      setupAccommodationRates(0.1)
      const scenario = makeScenario({
        projection: 2030,
        epciScenarios: [makeEpciScenario({ b2_tx_vacance_courte: 0.03, b2_tx_vacance_longue: 0.03 })],
      })
      const result = await service.getVacantAccomodationEvolutionByEpciAndYear(scenario, '200000001', 2025)
      // After peak year (2025), rate stays flat
      expect(result[2026]).toBe(result[2025])
      expect(result[2030]).toBe(result[2025])
    })

    it('should interpolate to target for short type', async () => {
      setupAccommodationRates(0.08, 0.05, 0.03)
      const scenario = makeScenario({
        projection: 2025,
        epciScenarios: [makeEpciScenario({ b2_tx_vacance_courte: 0.03, b2_tx_vacance_longue: 0.03 })],
      })
      const result = await service.getVacantAccomodationEvolutionByEpciAndYear(scenario, '200000001', 2025, 'short')
      expect(result[2021]).toBe(0.05)
      // Linear interpolation toward 0.03
      expect(result[2025]).toBeCloseTo(0.03)
    })

    it('should interpolate to target for long type', async () => {
      setupAccommodationRates(0.08, 0.05, 0.03)
      const scenario = makeScenario({
        projection: 2025,
        epciScenarios: [makeEpciScenario({ b2_tx_vacance_courte: 0.05, b2_tx_vacance_longue: 0.02 })],
      })
      const result = await service.getVacantAccomodationEvolutionByEpciAndYear(scenario, '200000001', 2025, 'long')
      expect(result[2021]).toBe(0.03)
      expect(result[2025]).toBeCloseTo(0.02)
    })

    it('should handle peak year equal to base year', async () => {
      setupAccommodationRates(0.08)
      const scenario = makeScenario({
        projection: 2030,
        epciScenarios: [makeEpciScenario({ b2_tx_vacance_courte: 0.04, b2_tx_vacance_longue: 0.04 })],
      })
      const result = await service.getVacantAccomodationEvolutionByEpciAndYear(scenario, '200000001', 2021)
      // All years after base should be flat at base rate
      expect(result[2022]).toBe(result[2021])
    })
  })

  describe('getSecondaryResidenceAccomodationEvolutionByEpciAndYear', () => {
    it('should linearly interpolate secondary residence rate', async () => {
      prisma.filocomFlux.findFirstOrThrow = jest.fn().mockResolvedValue({ txRsParctot: 0.05, parctot: 10000 } as any)

      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2025,
          epciScenarios: [makeEpciScenario({ b2_tx_rs: 0.03 })],
        }),
      })
      const result = await service.getSecondaryResidenceAccomodationEvolutionByEpciAndYear(simulation, '200000001', 2025)
      expect(result[2021]).toBe(0.05)
      // Linear interpolation from 0.05 to 0.03 over 4 years
      expect(result[2025]).toBeCloseTo(0.03)
    })

    it('should keep rate flat after peak year', async () => {
      prisma.filocomFlux.findFirstOrThrow = jest.fn().mockResolvedValue({ txRsParctot: 0.05, parctot: 10000 } as any)

      const simulation = makeSimulation({
        scenario: makeScenario({
          projection: 2030,
          epciScenarios: [makeEpciScenario({ b2_tx_rs: 0.03 })],
        }),
      })
      const result = await service.getSecondaryResidenceAccomodationEvolutionByEpciAndYear(simulation, '200000001', 2025)
      expect(result[2026]).toBe(result[2025])
      expect(result[2030]).toBe(result[2025])
    })
  })

  describe('getFilocomFlux', () => {
    it('should query prisma for filocom flux data', async () => {
      const mockData = { epciCode: '200000001', parctot: 10000, txRsParctot: 0.05 }
      prisma.filocomFlux.findFirstOrThrow = jest.fn().mockResolvedValue(mockData as any)

      const result = await service.getFilocomFlux('200000001')
      expect(result).toEqual(mockData)
      expect(prisma.filocomFlux.findFirstOrThrow).toHaveBeenCalledWith({ where: { epciCode: '200000001', millesime: '2021' } })
    })
  })
})
