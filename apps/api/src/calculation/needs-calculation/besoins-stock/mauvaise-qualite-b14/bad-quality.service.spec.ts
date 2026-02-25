import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { makeCalculationContext, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { BadQualityService } from './bad-quality.service'

describe('BadQualityService', () => {
  let service: BadQualityService
  let prisma: DeepMocked<PrismaService>

  const context = makeCalculationContext()

  beforeEach(async () => {
    prisma = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [BadQualityService, { provide: 'CalculationContext', useValue: context }, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<BadQualityService>(BadQualityService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateByEpci - RP source', () => {
    it('should calculate RP_abs_sani for locataire', async () => {
      prisma.badQuality_RP.findUniqueOrThrow = jest.fn().mockResolvedValue({
        saniLocNonhlm: 100,
        saniPpT: 200,
        saniChflLocNonhlm: 150,
        saniChflPpT: 250,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'RP',
          b14_confort: 'RP_abs_sani',
          b14_occupation: 'loc',
          b14_taux_reallocation: 10,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 100 * (1 - 10/100) = 90
      expect(result).toBe(90)
    })

    it('should calculate RP_abs_sani for proprietaire', async () => {
      prisma.badQuality_RP.findUniqueOrThrow = jest.fn().mockResolvedValue({
        saniLocNonhlm: 100,
        saniPpT: 200,
        saniChflLocNonhlm: 150,
        saniChflPpT: 250,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'RP',
          b14_confort: 'RP_abs_sani',
          b14_occupation: 'prop',
          b14_taux_reallocation: 10,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 200 * 0.9 = 180
      expect(result).toBe(180)
    })

    it('should calculate RP_abs_sani_chfl for both loc and prop', async () => {
      prisma.badQuality_RP.findUniqueOrThrow = jest.fn().mockResolvedValue({
        saniLocNonhlm: 100,
        saniPpT: 200,
        saniChflLocNonhlm: 150,
        saniChflPpT: 250,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'RP',
          b14_confort: 'RP_abs_sani_chfl',
          b14_occupation: 'loc,prop',
          b14_taux_reallocation: 10,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // (150 + 250) * 0.9 = 360
      expect(result).toBe(360)
    })
  })

  describe('calculateByEpci - Filo source', () => {
    it('should calculate for locataire', async () => {
      prisma.badQuality_Filocom.findUniqueOrThrow = jest.fn().mockResolvedValue({
        pppiLp: 300,
        pppiPo: 400,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'Filo',
          b14_occupation: 'loc',
          b14_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      expect(result).toBe(300)
    })

    it('should calculate for proprietaire', async () => {
      prisma.badQuality_Filocom.findUniqueOrThrow = jest.fn().mockResolvedValue({
        pppiLp: 300,
        pppiPo: 400,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'Filo',
          b14_occupation: 'prop',
          b14_taux_reallocation: 20,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 400 * 0.8 = 320
      expect(result).toBe(320)
    })
  })

  describe('calculateByEpci - FF source', () => {
    it('should construct dynamic column name and sum loc + prop', async () => {
      prisma.badQuality_Fonciers.findUniqueOrThrow = jest.fn().mockResolvedValue({
        ppSsChauffLoc: 500,
        ppSsChauffPpt: 600,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'FF',
          b14_qualite: 'FF_Ind',
          b14_confort: 'FF_abs_chauf',
          b14_occupation: 'loc,prop',
          b14_taux_reallocation: 0,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // ppSs + Chauff -> ppSsChauffLoc(500) + ppSsChauffPpt(600) = 1100
      expect(result).toBe(1100)
    })

    it('should handle FF with only loc', async () => {
      prisma.badQuality_Fonciers.findUniqueOrThrow = jest.fn().mockResolvedValue({
        ppSsWcLoc: 700,
        ppSsWcPpt: 800,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'FF',
          b14_qualite: 'FF_Ind',
          b14_confort: 'FF_abs_wc',
          b14_occupation: 'loc',
          b14_taux_reallocation: 15,
        }),
      })
      const result = await service.calculateByEpci(simulation, '200000001')
      // 700 * 0.85 = 595
      expect(result).toBe(595)
    })
  })

  describe('calculateByEpci - coefficient', () => {
    it('should apply coefficient to result', async () => {
      const coeffContext = makeCalculationContext({ coefficient: 1.5 })
      const module = await Test.createTestingModule({
        providers: [
          BadQualityService,
          { provide: 'CalculationContext', useValue: coeffContext },
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile()
      const coeffService = module.get<BadQualityService>(BadQualityService)

      prisma.badQuality_Filocom.findUniqueOrThrow = jest.fn().mockResolvedValue({
        pppiLp: 200,
        pppiPo: 0,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'Filo',
          b14_occupation: 'loc',
          b14_taux_reallocation: 0,
        }),
      })
      const result = await coeffService.calculateByEpci(simulation, '200000001')
      // 200 * 1.5 = 300
      expect(result).toBe(300)
    })
  })

  describe('calculate', () => {
    it('should compute totals across epcis', async () => {
      prisma.badQuality_RP.findUniqueOrThrow = jest.fn().mockResolvedValue({
        saniLocNonhlm: 100,
        saniPpT: 0,
      } as any)
      const simulation = makeSimulation({
        scenario: makeScenario({
          source_b14: 'RP',
          b14_confort: 'RP_abs_sani',
          b14_occupation: 'loc',
          b14_taux_reallocation: 0,
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
