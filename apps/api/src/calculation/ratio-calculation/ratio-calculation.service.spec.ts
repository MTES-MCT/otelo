import { Test, TestingModule } from '@nestjs/testing'
import { ratioConfig } from '~/calculation/ratio-calculation/ratio.config'
import { TScenario } from '~/schemas/scenarios/scenario'
import { RatioCalculationService } from './ratio-calculation.service'

describe('RatioCalculationService', () => {
  let service: RatioCalculationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatioCalculationService,
        {
          provide: 'RATIO_CONFIG',
          useValue: ratioConfig,
        },
      ],
    }).compile()

    service = module.get<RatioCalculationService>(RatioCalculationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getRatio43', () => {
    describe('when the taux effort is below 35', () => {
      it('should return the ratio 4/3', () => {
        const result = service.getRatio43({ b13_taux_effort: 34 } as TScenario, '1234567890')
        expect(result).toEqual(ratioConfig.default.ratio43.below35)
      })

      it('should return the ratio 4/3 for a region', () => {
        const result = service.getRatio43({ b13_taux_effort: 34 } as TScenario, '11')
        expect(result).toEqual(ratioConfig['11'].ratio43.below35)
      })
    })

    describe('when the taux effort is above 35', () => {
      it('should return the ratio 4/3', () => {
        const result = service.getRatio43({ b13_taux_effort: 35 } as TScenario, '1234567890')
        expect(result).toEqual(ratioConfig.default.ratio43.above35)
      })

      it('should return the ratio 4/3 for a region', () => {
        const result = service.getRatio43({ b13_taux_effort: 36 } as TScenario, '11')
        expect(result).toEqual(ratioConfig['11'].ratio43.above35)
      })
    })
  })

  describe('getRatio25', () => {
    it('should return the default ratio 2/5', () => {
      const result = service.getRatio25('1234567890')
      expect(result).toEqual(ratioConfig.default.ratio25)
    })

    it('should return the ratio 2/5 for a specific region', () => {
      const result = service.getRatio25('11')
      expect(result).toEqual(ratioConfig['11'].ratio25)
    })
  })

  describe('getRatio35', () => {
    describe('when the taux effort is below 35', () => {
      it('should return the default ratio 3/5', () => {
        const result = service.getRatio35({ b13_taux_effort: 34 } as TScenario, '1234567890')
        expect(result).toEqual(ratioConfig.default.ratio35.below35)
      })

      it('should return the ratio 3/5 for a specific region', () => {
        const result = service.getRatio35({ b13_taux_effort: 34 } as TScenario, '11')
        expect(result).toEqual(ratioConfig['11'].ratio35.below35)
      })
    })

    describe('when the taux effort is above or equal to 35', () => {
      it('should return the default ratio 3/5', () => {
        const result = service.getRatio35({ b13_taux_effort: 35 } as TScenario, '1234567890')
        expect(result).toEqual(ratioConfig.default.ratio35.above35)
      })

      it('should return the ratio 3/5 for a specific region', () => {
        const result = service.getRatio35({ b13_taux_effort: 36 } as TScenario, '11')
        expect(result).toEqual(ratioConfig['11'].ratio35.above35)
      })
    })
  })

  describe('getRatio45', () => {
    it('should return the default ratio 4/5', () => {
      const result = service.getRatio45('1234567890')
      expect(result).toEqual(ratioConfig.default.ratio45)
    })

    it('should return the ratio 4/5 for a specific region', () => {
      const result = service.getRatio45('11')
      expect(result).toEqual(ratioConfig['11'].ratio45)
    })
  })
})
