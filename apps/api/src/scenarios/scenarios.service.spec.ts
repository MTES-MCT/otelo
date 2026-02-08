import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { TInitScenario, TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { ScenariosService } from './scenarios.service'

describe('ScenariosService', () => {
  let service: ScenariosService
  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScenariosService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile()

    service = module.get<ScenariosService>(ScenariosService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('hasUserAccessTo', () => {
    it('should return true when a scenario is found', async () => {
      mockPrismaService.scenario.findFirst = jest.fn().mockResolvedValue({ id: 'scenario-1' })

      const result = await service.hasUserAccessTo('scenario-1', 'user-1')

      expect(result).toBe(true)
      expect(mockPrismaService.scenario.findFirst).toHaveBeenCalledWith({
        where: { id: 'scenario-1', userId: 'user-1' },
      })
    })

    it('should return false when no scenario is found', async () => {
      mockPrismaService.scenario.findFirst = jest.fn().mockResolvedValue(null)

      const result = await service.hasUserAccessTo('scenario-1', 'user-1')

      expect(result).toBe(false)
      expect(mockPrismaService.scenario.findFirst).toHaveBeenCalledWith({
        where: { id: 'scenario-1', userId: 'user-1' },
      })
    })
  })

  describe('get', () => {
    it('should return a scenario with sorted epciScenarios', async () => {
      const mockScenario = {
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-1',
        epciScenarios: [
          { epciCode: 'EPCI002', baseEpci: false },
          { epciCode: 'EPCI001', baseEpci: true },
        ],
        demographicEvolutionOmphaleCustom: [],
      }

      mockPrismaService.scenario.findUniqueOrThrow = jest.fn().mockResolvedValue(mockScenario)

      const result = await service.get('scenario-1')

      expect(result.epciScenarios[0].baseEpci).toBe(true)
      expect(mockPrismaService.scenario.findUniqueOrThrow).toHaveBeenCalledWith({
        include: {
          epciScenarios: true,
          demographicEvolutionOmphaleCustom: true,
        },
        where: { id: 'scenario-1' },
      })
    })
  })

  describe('list', () => {
    it('should return all scenarios for a user', async () => {
      const mockScenarios = [
        { id: 'scenario-1', name: 'Scenario 1' },
        { id: 'scenario-2', name: 'Scenario 2' },
      ]

      mockPrismaService.scenario.findMany = jest.fn().mockResolvedValue(mockScenarios)

      const result = await service.list('user-1')

      expect(result).toEqual(mockScenarios)
      expect(mockPrismaService.scenario.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })
  })

  describe('create', () => {
    it('should create a scenario', async () => {
      const mockCreateData = {
        b2_scenario: 'central',
        projection: 2030,
        epcis: {
          EPCI001: { b2_tx_rs: 0.1, b2_tx_vacance: 0.05, baseEpci: true },
        },
      } as unknown as TInitScenario

      const mockCreatedScenario = {
        id: 'scenario-1',
        userId: 'user-1',
      }

      mockPrismaService.scenario.create = jest.fn().mockResolvedValue(mockCreatedScenario)

      const result = await service.create('user-1', mockCreateData)

      expect(result).toEqual(mockCreatedScenario)
      expect(mockPrismaService.scenario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          b2_scenario: 'central',
          projection: 2030,
          epciScenarios: {
            createMany: {
              data: [{ epciCode: 'EPCI001', b2_tx_rs: 0.1, b2_tx_vacance: 0.05, baseEpci: true }],
            },
          },
          user: { connect: { id: 'user-1' } },
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a scenario', async () => {
      const updateData = {
        id: 'scenario-1',
        b2_scenario: 'haut',
      } as unknown as TUpdateSimulationDto

      const mockUpdatedScenario = {
        id: 'scenario-1',
        b2_scenario: 'haut',
      }

      mockPrismaService.scenario.update = jest.fn().mockResolvedValue(mockUpdatedScenario)

      const result = await service.update('scenario-1', updateData)

      expect(result).toEqual(mockUpdatedScenario)
      expect(mockPrismaService.scenario.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          b2_scenario: 'haut',
        }),
        where: { id: 'scenario-1' },
      })
    })
  })

  describe('delete', () => {
    it('should delete a scenario', async () => {
      const mockDeletedScenario = {
        id: 'scenario-1',
        name: 'Deleted Scenario',
      }

      mockPrismaService.scenario.delete = jest.fn().mockResolvedValue(mockDeletedScenario)

      const result = await service.delete('user-1', 'scenario-1')

      expect(result).toEqual(mockDeletedScenario)
      expect(mockPrismaService.scenario.delete).toHaveBeenCalledWith({
        where: { id: 'scenario-1', userId: 'user-1' },
      })
    })
  })
})
