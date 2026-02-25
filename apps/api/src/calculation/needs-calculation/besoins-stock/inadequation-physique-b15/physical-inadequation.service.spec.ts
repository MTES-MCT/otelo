import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { HostedService } from '~/calculation/needs-calculation/besoins-stock/heberges-b12/hosted.service'
import { FinancialInadequationService } from '~/calculation/needs-calculation/besoins-stock/inadequation-financiere-b13/financial-inadequation.service'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { makeCalculationContext, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { PhysicalInadequationService } from './physical-inadequation.service'

describe('PhysicalInadequationService', () => {
  let service: PhysicalInadequationService
  let prisma: DeepMocked<PrismaService>
  let ratioService: DeepMocked<RatioCalculationService>
  let badQualityService: DeepMocked<BadQualityService>
  let financialService: DeepMocked<FinancialInadequationService>
  let hostedService: DeepMocked<HostedService>

  const context = makeCalculationContext()

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    ratioService = createMock<RatioCalculationService>()
    badQualityService = createMock<BadQualityService>()
    financialService = createMock<FinancialInadequationService>()
    hostedService = createMock<HostedService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalInadequationService,
        { provide: 'CalculationContext', useValue: context },
        { provide: PrismaService, useValue: prisma },
        { provide: RatioCalculationService, useValue: ratioService },
        { provide: BadQualityService, useValue: badQualityService },
        { provide: FinancialInadequationService, useValue: financialService },
        { provide: HostedService, useValue: hostedService },
      ],
    }).compile()

    service = module.get<PhysicalInadequationService>(PhysicalInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateByEpci - RP source', () => {
    const setupRPMocks = (suroccData: Record<string, number> = {}) => {
      prisma.physicalInadequation_RP.findFirstOrThrow = jest.fn().mockResolvedValue({
        nbMenModPpT: 100,
        nbMenModLocNonHLM: 200,
        nbMenAccPpT: 150,
        nbMenAccLocNonHLM: 250,
        ...suroccData,
      } as any)
      ratioService.getRatio25.mockReturnValue(0.1)
      ratioService.getRatio35.mockReturnValue(0.1)
      ratioService.getRatio45.mockReturnValue(0.1)
      hostedService.calculateByEpci.mockResolvedValue(100)
      financialService.calculateByEpci.mockResolvedValue(100)
      badQualityService.calculateByEpci.mockResolvedValue(100)
    }

    it('should calculate RP with Mod surocc for proprietaire and loc_hors_hlm', async () => {
      setupRPMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'RP',
          b15_surocc: 'Mod' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: true,
          b15_taux_reallocation: 10,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // RP: nbMenModPpT(100) + nbMenModLocNonHLM(200) = 300
      // deductions: -0.1*100 - 0.1*100 - 0.1*100 = -30
      // 300 - 30 = 270, * (1 - 10/100) = 243
      expect(result).toBe(243)
    })

    it('should calculate RP with only proprietaire', async () => {
      setupRPMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'RP',
          b15_surocc: 'Mod' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: false,
          b15_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 100 + 0 - 30 = 70
      expect(result).toBe(70)
    })

    it('should use Acc surocc mapping (Lourde for Filo)', async () => {
      setupRPMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'RP',
          b15_surocc: 'Acc' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: true,
          b15_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // nbMenAccPpT(150) + nbMenAccLocNonHLM(250) = 400 - 30 = 370
      expect(result).toBe(370)
    })
  })

  describe('calculateByEpci - Filo source', () => {
    it('should calculate Filo with Mod surocc (maps to Leg)', async () => {
      prisma.physicalInadequation_Filo.findFirstOrThrow = jest.fn().mockResolvedValue({
        suroccLegPo: 300,
        suroccLegLp: 400,
        suroccLourdePo: 500,
        suroccLourdeLp: 600,
      } as any)
      ratioService.getRatio25.mockReturnValue(0)
      ratioService.getRatio35.mockReturnValue(0)
      ratioService.getRatio45.mockReturnValue(0)
      hostedService.calculateByEpci.mockResolvedValue(0)
      financialService.calculateByEpci.mockResolvedValue(0)
      badQualityService.calculateByEpci.mockResolvedValue(0)

      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'Filo',
          b15_surocc: 'Mod' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: true,
          b15_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // Mod -> Leg: suroccLegPo(300) + suroccLegLp(400) = 700
      expect(result).toBe(700)
    })

    it('should calculate Filo with Acc surocc (maps to Lourde)', async () => {
      prisma.physicalInadequation_Filo.findFirstOrThrow = jest.fn().mockResolvedValue({
        suroccLegPo: 300,
        suroccLegLp: 400,
        suroccLourdePo: 500,
        suroccLourdeLp: 600,
      } as any)
      ratioService.getRatio25.mockReturnValue(0)
      ratioService.getRatio35.mockReturnValue(0)
      ratioService.getRatio45.mockReturnValue(0)
      hostedService.calculateByEpci.mockResolvedValue(0)
      financialService.calculateByEpci.mockResolvedValue(0)
      badQualityService.calculateByEpci.mockResolvedValue(0)

      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'Filo',
          b15_surocc: 'Acc' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: true,
          b15_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // Acc -> Lourde: suroccLourdePo(500) + suroccLourdeLp(600) = 1100
      expect(result).toBe(1100)
    })
  })

  describe('calculateByEpci - reallocation and ratio deductions', () => {
    it('should apply reallocation rate', async () => {
      prisma.physicalInadequation_Filo.findFirstOrThrow = jest.fn().mockResolvedValue({
        suroccLegPo: 1000,
        suroccLegLp: 0,
      } as any)
      ratioService.getRatio25.mockReturnValue(0)
      ratioService.getRatio35.mockReturnValue(0)
      ratioService.getRatio45.mockReturnValue(0)
      hostedService.calculateByEpci.mockResolvedValue(0)
      financialService.calculateByEpci.mockResolvedValue(0)
      badQualityService.calculateByEpci.mockResolvedValue(0)

      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'Filo',
          b15_surocc: 'Mod' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: false,
          b15_taux_reallocation: 20,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 1000 * (1-0.2) = 800
      expect(result).toBe(800)
    })

    it('should subtract ratio-weighted deductions from other services', async () => {
      prisma.physicalInadequation_Filo.findFirstOrThrow = jest.fn().mockResolvedValue({
        suroccLegPo: 1000,
        suroccLegLp: 0,
      } as any)
      ratioService.getRatio25.mockReturnValue(0.2)
      ratioService.getRatio35.mockReturnValue(0.3)
      ratioService.getRatio45.mockReturnValue(0.1)
      hostedService.calculateByEpci.mockResolvedValue(100)
      financialService.calculateByEpci.mockResolvedValue(200)
      badQualityService.calculateByEpci.mockResolvedValue(300)

      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'Filo',
          b15_surocc: 'Mod' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: false,
          b15_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 1000 + (-0.2*100) + (-0.3*200) + (-0.1*300) = 1000 - 20 - 60 - 30 = 890
      expect(result).toBe(890)
    })
  })

  describe('calculate', () => {
    it('should compute totals across epcis', async () => {
      prisma.physicalInadequation_RP.findFirstOrThrow = jest.fn().mockResolvedValue({
        nbMenModPpT: 100,
        nbMenModLocNonHLM: 0,
      } as any)
      ratioService.getRatio25.mockReturnValue(0)
      ratioService.getRatio35.mockReturnValue(0)
      ratioService.getRatio45.mockReturnValue(0)
      hostedService.calculateByEpci.mockResolvedValue(0)
      financialService.calculateByEpci.mockResolvedValue(0)
      badQualityService.calculateByEpci.mockResolvedValue(0)

      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          source_b15: 'RP',
          b15_surocc: 'Mod' as any,
          b15_proprietaire: true,
          b15_loc_hors_hlm: false,
          b15_taux_reallocation: 0,
          projection: 2041,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = await service.calculate(simulation)
      expect(result.total).toBe(100)
      expect(result.epcis).toHaveLength(1)
    })
  })
})
