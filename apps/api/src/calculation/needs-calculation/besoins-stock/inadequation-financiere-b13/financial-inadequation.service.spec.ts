import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { BadQualityService } from '~/calculation/needs-calculation/besoins-stock/mauvaise-qualite-b14/bad-quality.service'
import { RatioCalculationService } from '~/calculation/ratio-calculation/ratio-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { makeCalculationContext, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { FinancialInadequationService } from './financial-inadequation.service'

describe('FinancialInadequationService', () => {
  let service: FinancialInadequationService
  let prisma: DeepMocked<PrismaService>
  let ratioService: DeepMocked<RatioCalculationService>
  let badQualityService: DeepMocked<BadQualityService>

  const context = makeCalculationContext()

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    ratioService = createMock<RatioCalculationService>()
    badQualityService = createMock<BadQualityService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialInadequationService,
        { provide: 'CalculationContext', useValue: context },
        { provide: PrismaService, useValue: prisma },
        { provide: RatioCalculationService, useValue: ratioService },
        { provide: BadQualityService, useValue: badQualityService },
      ],
    }).compile()

    service = module.get<FinancialInadequationService>(FinancialInadequationService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateByEpci', () => {
    const setupMocks = (financialData: Record<string, number> = {}, badQuality = 100, ratio43 = 0.1) => {
      prisma.financialInadequation.findUniqueOrThrow = jest.fn().mockResolvedValue({
        nbAllPlus30AccessionPropriete: 200,
        nbAllPlus30ParcLocatifPrive: 300,
        nbAllPlus40AccessionPropriete: 150,
        nbAllPlus40ParcLocatifPrive: 250,
        ...financialData,
      } as any)
      badQualityService.calculateByEpci.mockResolvedValue(badQuality)
      ratioService.getRatio43.mockReturnValue(ratio43)
    }

    it('should calculate with both accession and plp enabled', async () => {
      setupMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({ b13_acc: true, b13_plp: true, b13_taux_effort: 30, b13_taux_reallocation: 10 }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // accession(200) + plp(300) + ratio43(0.1) * badQuality(100) * -1 = 490
      // (1 - 10/100) * 490 = 0.9 * 490 = 441
      expect(result).toBe(441)
    })

    it('should calculate with only accession enabled', async () => {
      setupMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({ b13_acc: true, b13_plp: false, b13_taux_effort: 30, b13_taux_reallocation: 0 }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 200 + 0.1*100*-1 = 190, (1-0)*190 = 190
      expect(result).toBe(190)
    })

    it('should calculate with only plp enabled', async () => {
      setupMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({ b13_acc: false, b13_plp: true, b13_taux_effort: 30, b13_taux_reallocation: 0 }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 300 - 10 = 290
      expect(result).toBe(290)
    })

    it('should apply reallocation rate', async () => {
      setupMocks({}, 0, 0)
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({ b13_acc: true, b13_plp: true, b13_taux_effort: 30, b13_taux_reallocation: 50 }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // (200 + 300 + 0) * 0.5 = 250
      expect(result).toBe(250)
    })

    it('should use different taux_effort column', async () => {
      setupMocks()
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({ b13_acc: true, b13_plp: false, b13_taux_effort: 40, b13_taux_reallocation: 0 }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // accession at 40: 150 - 10 = 140
      expect(result).toBe(140)
    })

    it('should subtract ratio43 * badQuality', async () => {
      setupMocks({}, 500, 0.2)
      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({ b13_acc: false, b13_plp: false, b13_taux_effort: 30, b13_taux_reallocation: 0 }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 0 + 0 + 0.2 * 500 * -1 = -100
      expect(result).toBe(-100)
    })
  })

  describe('calculate', () => {
    it('should compute totals and prorata', async () => {
      prisma.financialInadequation.findUniqueOrThrow = jest.fn().mockResolvedValue({
        nbAllPlus30AccessionPropriete: 200,
        nbAllPlus30ParcLocatifPrive: 0,
      } as any)
      badQualityService.calculateByEpci.mockResolvedValue(0)
      ratioService.getRatio43.mockReturnValue(0)

      const simulation = makeSimulation({
        epcis: [{ code: '200000001', name: 'Test', bassinName: null, region: '11' } as any],
        scenario: makeScenario({
          b13_acc: true,
          b13_plp: false,
          b13_taux_effort: 30,
          b13_taux_reallocation: 0,
          projection: 2041,
          b1_horizon_resorption: 2041,
        }),
      })
      const result = await service.calculate(simulation)
      expect(result.total).toBe(200)
      expect(result.epcis).toHaveLength(1)
    })
  })
})
