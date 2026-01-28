import { Test, TestingModule } from '@nestjs/testing'
import { CoefficientCalculationService } from './coefficient-calculation.service'

describe('CoefficientCalculationService', () => {
  let service: CoefficientCalculationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoefficientCalculationService,
        {
          provide: 'COEFFICIENT_CONFIG',
          useValue: {
            baseCoeff: {
              '01': 4.0,
              '02': 4.0,
              '03': 4.0,
              '04': 4.0,
              default: 6.0,
            },
          },
        },
      ],
    }).compile()

    service = module.get<CoefficientCalculationService>(CoefficientCalculationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateCoefficient', () => {
    it('should return 1 if projectionPeriod is greater than horizonResorption', () => {
      expect(service.calculateCoefficient(6)).toBe(1)
    })

    it('should return projectionPeriod / horizon - baseYearResorption if projectionPeriod is less than horizonResorption', () => {
      expect(service.calculateCoefficient(12, 6)).toBe(0.5)
    })
  })

  describe('calculateRenewalRate', () => {
    it('should handle zero rates correctly', () => {
      const result = service.calculateRenewalRate(0, 0, 6, '01')
      expect(result).toBeCloseTo(0, 4)
    })

    it('should use default baseCoeff if regionCode is not found', () => {
      const result = service.calculateRenewalRate(0.02, 1, 6, 'unknown')
      expect(result).toBeCloseTo(0.0825386305, 4)
    })
  })
})
