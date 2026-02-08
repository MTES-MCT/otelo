import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { makeCalculationContext, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { HostedService } from './hosted.service'

describe('HostedService', () => {
  let service: HostedService
  let prisma: DeepMocked<PrismaService>

  const context = makeCalculationContext()

  beforeEach(async () => {
    prisma = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [HostedService, { provide: 'CalculationContext', useValue: context }, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<HostedService>(HostedService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateByEpci', () => {
    const setupMocks = () => {
      prisma.hostedFilocom.findFirstOrThrow.mockResolvedValue({ value: 1000 } as any)
      prisma.hostedSne.findFirstOrThrow.mockResolvedValue({ particular: 50, temporary: 30 } as any)
    }

    it('should calculate with cohab_interg_subie percentage applied to filocom', async () => {
      setupMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          b12_cohab_interg_subie: 40,
          b12_heberg_particulier: false,
          b12_heberg_temporaire: false,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // (40/100) * 1000 = 400
      expect(result).toBe(400)
    })

    it('should add particular when b12_heberg_particulier is true', async () => {
      setupMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          b12_cohab_interg_subie: 40,
          b12_heberg_particulier: true,
          b12_heberg_temporaire: false,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 400 + 50 = 450
      expect(result).toBe(450)
    })

    it('should add temporary when b12_heberg_temporaire is true', async () => {
      setupMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          b12_cohab_interg_subie: 40,
          b12_heberg_particulier: false,
          b12_heberg_temporaire: true,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 400 + 30 = 430
      expect(result).toBe(430)
    })

    it('should add both when both flags enabled', async () => {
      setupMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          b12_cohab_interg_subie: 50,
          b12_heberg_particulier: true,
          b12_heberg_temporaire: true,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // (50/100)*1000 + 50 + 30 = 580
      expect(result).toBe(580)
    })

    it('should apply coefficient', async () => {
      const coeffContext = makeCalculationContext({ coefficient: 2 })
      const module = await Test.createTestingModule({
        providers: [HostedService, { provide: 'CalculationContext', useValue: coeffContext }, { provide: PrismaService, useValue: prisma }],
      }).compile()
      const coeffService = module.get<HostedService>(HostedService)

      setupMocks()
      const simulation = makeSimulation({
        scenario: makeScenario({
          b12_cohab_interg_subie: 50,
          b12_heberg_particulier: false,
          b12_heberg_temporaire: false,
        }),
      })
      const result = await coeffService.calculateByEpci(simulation, '200000001')
      // (50/100)*1000 = 500 * 2 = 1000
      expect(result).toBe(1000)
    })
  })

  describe('calculate', () => {
    it('should aggregate results across epcis and compute totals', async () => {
      prisma.hostedFilocom.findFirstOrThrow.mockResolvedValue({ value: 1000 } as any)
      prisma.hostedSne.findFirstOrThrow.mockResolvedValue({ particular: 0, temporary: 0 } as any)

      const simulation = makeSimulation({
        scenario: makeScenario({
          b12_cohab_interg_subie: 50,
          b12_heberg_particulier: false,
          b12_heberg_temporaire: false,
          projection: 2041,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = await service.calculate(simulation)
      expect(result.total).toBe(500)
      expect(result.epcis).toHaveLength(1)
      expect(result.epcis[0].value).toBe(500)
    })
  })
})
