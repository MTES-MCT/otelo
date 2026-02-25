import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ESourceB11 } from '~/schemas/scenarios/scenario'
import { makeCalculationContext, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { NoAccomodationService } from './no-accomodation.service'

describe('NoAccomodationService', () => {
  let service: NoAccomodationService
  let prisma: DeepMocked<PrismaService>

  const context = makeCalculationContext()

  beforeEach(async () => {
    prisma = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoAccomodationService,
        { provide: 'CalculationContext', useValue: context },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<NoAccomodationService>(NoAccomodationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateByEpci', () => {
    const setupPrismaMocks = (overrides?: {
      homeless?: { rp: number; sne: number }
      hotel?: { rp: number; sne: number }
      rpMakeShift?: { value: number }
      sneMakeShift?: { camping: number; squat: number }
      hostedFiness?: Record<string, number>
    }) => {
      const defaults = {
        homeless: { rp: 100, sne: 120 },
        hotel: { rp: 200, sne: 250 },
        rpMakeShift: { value: 50 },
        sneMakeShift: { camping: 30, squat: 40 },
        hostedFiness: { autreCentre: 80, demandeAsile: 60 },
      }
      const vals = { ...defaults, ...overrides }

      prisma.homeless.findFirstOrThrow = jest.fn().mockResolvedValue(vals.homeless as any)
      prisma.hotel.findFirstOrThrow = jest.fn().mockResolvedValue(vals.hotel as any)
      prisma.makeShiftHousing_RP.findFirstOrThrow = jest.fn().mockResolvedValue(vals.rpMakeShift as any)
      prisma.makeShiftHousing_SNE.findFirstOrThrow = jest.fn().mockResolvedValue(vals.sneMakeShift as any)
      prisma.hostedFiness.findFirstOrThrow = jest.fn().mockResolvedValue(vals.hostedFiness as any)
    }

    it('should calculate using RP source with all flags enabled', async () => {
      setupPrismaMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b11: ESourceB11.RP,
          b11_sa: true,
          b11_fortune: true,
          b11_hotel: true,
          b11_etablissement: ['autreCentre' as any],
          b11_part_etablissement: 50,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // sans_abri(100) + fortune(50) + hotel(200) = 350
      // finess: autreCentre(80) * 50/100 = 40
      // total: 350 + 40 = 390
      expect(result).toBe(390)
    })

    it('should calculate using SNE source', async () => {
      setupPrismaMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b11: ESourceB11.SNE,
          b11_sa: true,
          b11_fortune: true,
          b11_hotel: true,
          b11_etablissement: ['autreCentre' as any],
          b11_part_etablissement: 50,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // sans_abri(120) + fortune(30+40=70) + hotel(250) = 440
      // finess: 80 * 0.5 = 40
      // total: 440 + 40 = 480
      expect(result).toBe(480)
    })

    it('should disable specific categories when flags are false', async () => {
      setupPrismaMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b11: ESourceB11.RP,
          b11_sa: false,
          b11_fortune: false,
          b11_hotel: true,
          b11_etablissement: ['autreCentre' as any],
          b11_part_etablissement: 50,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // only hotel(200) + finess(40) = 240
      expect(result).toBe(240)
    })

    it('should apply coefficient', async () => {
      const coeffContext = makeCalculationContext({ coefficient: 1.5 })
      const module = await Test.createTestingModule({
        providers: [
          NoAccomodationService,
          { provide: 'CalculationContext', useValue: coeffContext },
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile()
      const coeffService = module.get<NoAccomodationService>(NoAccomodationService)

      setupPrismaMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b11: ESourceB11.RP,
          b11_sa: true,
          b11_fortune: false,
          b11_hotel: false,
          b11_etablissement: [],
          b11_part_etablissement: 0,
        }),
      })
      const result = await coeffService.calculateByEpci(simulation, '200000001')
      // sans_abri(100) + finess(0) = 100 * 1.5 = 150
      expect(result).toBe(150)
    })

    it('should return 0 when hostedFiness throws', async () => {
      prisma.homeless.findFirstOrThrow = jest.fn().mockResolvedValue({ rp: 100, sne: 120 } as any)
      prisma.hotel.findFirstOrThrow = jest.fn().mockResolvedValue({ rp: 200, sne: 250 } as any)
      prisma.makeShiftHousing_RP.findFirstOrThrow = jest.fn().mockResolvedValue({ value: 50 } as any)
      prisma.makeShiftHousing_SNE.findFirstOrThrow = jest.fn().mockResolvedValue({ camping: 30, squat: 40 } as any)
      prisma.hostedFiness.findFirstOrThrow = jest.fn().mockRejectedValue(new Error('Not found'))

      const simulation = makeSimulation({
        scenario: makeScenario({ source_b11: ESourceB11.RP, b11_sa: true, b11_fortune: true, b11_hotel: true }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      expect(result).toBe(0)
    })
  })

  describe('calculate', () => {
    it('should compute prorata when horizon > projection', async () => {
      prisma.homeless.findFirstOrThrow = jest.fn().mockResolvedValue({ rp: 100 } as any)
      prisma.hotel.findFirstOrThrow = jest.fn().mockResolvedValue({ rp: 0 } as any)
      prisma.makeShiftHousing_RP.findFirstOrThrow = jest.fn().mockResolvedValue({ value: 0 } as any)
      prisma.makeShiftHousing_SNE.findFirstOrThrow = jest.fn().mockResolvedValue({ camping: 0, squat: 0 } as any)
      prisma.hostedFiness.findFirstOrThrow = jest.fn().mockResolvedValue({} as any)

      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b11: ESourceB11.RP,
          b11_sa: true,
          b11_fortune: false,
          b11_hotel: false,
          b11_etablissement: [],
          b11_part_etablissement: 0,
          projection: 2031,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = await service.calculate(simulation)
      // value = 100, prorata = 100 * (2031 - 2021) / (2041 - 2021) = 100 * 10/20 = 50
      expect(result.epcis[0].value).toBe(100)
      expect(result.epcis[0].prorataValue).toBe(50)
    })

    it('should not apply prorata when horizon <= projection', async () => {
      prisma.homeless.findFirstOrThrow = jest.fn().mockResolvedValue({ rp: 100 } as any)
      prisma.hotel.findFirstOrThrow = jest.fn().mockResolvedValue({ rp: 0 } as any)
      prisma.makeShiftHousing_RP.findFirstOrThrow = jest.fn().mockResolvedValue({ value: 0 } as any)
      prisma.makeShiftHousing_SNE.findFirstOrThrow = jest.fn().mockResolvedValue({ camping: 0, squat: 0 } as any)
      prisma.hostedFiness.findFirstOrThrow = jest.fn().mockResolvedValue({} as any)

      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b11: ESourceB11.RP,
          b11_sa: true,
          b11_fortune: false,
          b11_hotel: false,
          b11_etablissement: [],
          b11_part_etablissement: 0,
          projection: 2041,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = await service.calculate(simulation)
      expect(result.epcis[0].prorataValue).toBe(Math.round(result.epcis[0].value))
    })
  })
})
