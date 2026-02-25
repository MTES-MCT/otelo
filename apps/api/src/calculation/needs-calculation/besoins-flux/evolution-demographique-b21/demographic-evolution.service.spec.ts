import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { EOmphale, TGetDemographicEvolution } from '~/schemas/demographic-evolution/demographic-evolution'
import { makeCalculationContext, makeScenario, makeSimulation } from '../../__test-utils__/calculation-test-fixtures'
import { DemographicEvolutionService } from './demographic-evolution.service'

describe('DemographicEvolutionService', () => {
  let service: DemographicEvolutionService
  let prisma: DeepMocked<PrismaService>

  const context = makeCalculationContext({ baseYear: 2021 })

  beforeEach(async () => {
    prisma = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemographicEvolutionService,
        { provide: 'CalculationContext', useValue: context },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<DemographicEvolutionService>(DemographicEvolutionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculateOmphaleProjectionsByYearAndEpci', () => {
    it('should compute year-over-year deltas from omphale projections', async () => {
      const menages: TGetDemographicEvolution[] = [
        { epciCode: '200000001', centralH: 1000, year: 2021 },
        { epciCode: '200000001', centralH: 1100, year: 2022 },
        { epciCode: '200000001', centralH: 1250, year: 2023 },
      ]
      const simulation = makeSimulation({ scenario: makeScenario({ b2_scenario: 'Central_H' }) })
      const result = await service.calculateOmphaleProjectionsByYearAndEpci(menages, simulation)

      expect(result.data).toHaveLength(3)
      // First year delta is 0 (1000 - 1000)
      expect(result.data[0]).toEqual({ value: 0, year: 2021, yearValue: 1000, previousYearValue: 1000 })
      // Second year: 1100 - 1000 = 100
      expect(result.data[1]).toEqual({ value: 100, year: 2022, yearValue: 1100, previousYearValue: 1000 })
      // Third year: 1250 - 1100 = 150
      expect(result.data[2]).toEqual({ value: 150, year: 2023, yearValue: 1250, previousYearValue: 1100 })
    })

    it('should compute correct metadata (min/max values and period)', async () => {
      const menages: TGetDemographicEvolution[] = [
        { epciCode: '200000001', centralH: 1000, year: 2021 },
        { epciCode: '200000001', centralH: 1100, year: 2022 },
        { epciCode: '200000001', centralH: 1050, year: 2023 },
      ]
      const simulation = makeSimulation({ scenario: makeScenario({ b2_scenario: 'Central_H' }) })
      const result = await service.calculateOmphaleProjectionsByYearAndEpci(menages, simulation)

      expect(result.metadata.data.max).toBe(100) // delta 1100-1000
      expect(result.metadata.data.min).toBe(-50) // delta 1050-1100
      expect(result.metadata.period.startYear).toBe(2021)
      expect(result.metadata.period.endYear).toBe(2023)
    })

    it('should filter projections by baseYear', async () => {
      const menages: TGetDemographicEvolution[] = [
        { epciCode: '200000001', centralH: 900, year: 2019 },
        { epciCode: '200000001', centralH: 950, year: 2020 },
        { epciCode: '200000001', centralH: 1000, year: 2021 },
        { epciCode: '200000001', centralH: 1100, year: 2022 },
      ]
      const simulation = makeSimulation({ scenario: makeScenario({ b2_scenario: 'Central_H' }) })
      const result = await service.calculateOmphaleProjectionsByYearAndEpci(menages, simulation)

      // Should only include 2021+ (baseYear = 2021)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].year).toBe(2021)
    })

    it('should handle custom baseYear parameter', async () => {
      const menages: TGetDemographicEvolution[] = [
        { epciCode: '200000001', centralH: 950, year: 2020 },
        { epciCode: '200000001', centralH: 1000, year: 2021 },
        { epciCode: '200000001', centralH: 1100, year: 2022 },
      ]
      const simulation = makeSimulation({ scenario: makeScenario({ b2_scenario: 'Central_H' }) })
      const result = await service.calculateOmphaleProjectionsByYearAndEpci(menages, simulation, 2020)

      // Should include from 2020
      expect(result.data).toHaveLength(3)
      expect(result.data[0].year).toBe(2020)
    })

    it('should sort projections by year before processing', async () => {
      const menages: TGetDemographicEvolution[] = [
        { epciCode: '200000001', centralH: 1100, year: 2022 },
        { epciCode: '200000001', centralH: 1000, year: 2021 },
      ]
      const simulation = makeSimulation({ scenario: makeScenario({ b2_scenario: 'Central_H' }) })
      const result = await service.calculateOmphaleProjectionsByYearAndEpci(menages, simulation)

      expect(result.data[0].year).toBe(2021)
      expect(result.data[1].year).toBe(2022)
      expect(result.data[1].value).toBe(100)
    })
  })

  describe('getProjectionsByOmphale', () => {
    it('should query prisma with correct parameters', async () => {
      prisma.demographicEvolutionOmphale.findMany = jest.fn().mockResolvedValue([
        { epciCode: '200000001', centralH: 1000, year: 2021 },
        { epciCode: '200000001', centralH: 1100, year: 2022 },
      ] as any)

      const result = await service.getProjectionsByOmphale({ epciCode: '200000001', omphale: EOmphale.CENTRAL_H }, 2041)

      expect(prisma.demographicEvolutionOmphale.findMany).toHaveBeenCalledWith({
        select: { epciCode: true, centralH: true, year: true },
        where: { epciCode: '200000001', year: { lte: 2041 } },
      })
      expect(result).toHaveLength(2)
    })
  })
})
