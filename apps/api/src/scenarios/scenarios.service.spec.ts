import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { TCreateScenario } from '~/schemas/scenarios/create-scenario'
import { TScenario } from '~/schemas/scenarios/scenario'
import { ScenariosService } from './scenarios.service'

jest.mock('~/schemas/scenarios/scenario', () => ({
  ZScenario: {
    parse: jest.fn().mockImplementation((data) => data),
  },
}))

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
    it('should return a scenario for a user', async () => {
      const mockScenario = {
        id: 'scenario-1',
        name: 'Test Scenario',
        rules: { someRule: true },
        userId: 'user-1',
      }

      mockPrismaService.scenario.findUniqueOrThrow = jest.fn().mockResolvedValue(mockScenario)

      const result = await service.get('user-1', 'scenario-1')

      expect(result).toEqual(mockScenario)
      expect(mockPrismaService.scenario.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'scenario-1', userId: 'user-1' },
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
        b11_sa: true,
        b1_horizon_resorption: 1,
        name: 'New Scenario',
      } as unknown as TCreateScenario

      const mockCreatedScenario = {
        id: 'scenario-1',
        ...mockCreateData,
        userId: 'user-1',
      }

      mockPrismaService.scenario.create = jest.fn().mockResolvedValue(mockCreatedScenario)

      const result = await service.create('user-1', mockCreateData)

      expect(result).toEqual(mockCreatedScenario)
      expect(mockPrismaService.scenario.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateData,
          user: { connect: { id: 'user-1' } },
        },
      })
    })
  })

  describe('update', () => {
    it('should update a scenario', async () => {
      const updateData = {
        name: 'Updated Scenario',
      } as Partial<TScenario>

      const mockUpdatedScenario = {
        id: 'scenario-1',
        ...updateData,
        userId: 'user-1',
      }

      mockPrismaService.scenario.update = jest.fn().mockResolvedValue(mockUpdatedScenario)

      const result = await service.update('user-1', 'scenario-1', updateData)

      expect(result).toEqual(mockUpdatedScenario)
      expect(mockPrismaService.scenario.update).toHaveBeenCalledWith({
        data: {
          ...updateData,
        },
        where: { id: 'scenario-1', userId: 'user-1' },
      })
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Updated Name' } as Partial<TScenario>

      mockPrismaService.scenario.update = jest.fn().mockResolvedValue({ id: 'scenario-1', ...partialUpdate })

      const result = await service.update('user-1', 'scenario-1', partialUpdate)

      expect(result).toBeDefined()
      expect(mockPrismaService.scenario.update).toHaveBeenCalledWith({
        data: {
          ...partialUpdate,
        },
        where: { id: 'scenario-1', userId: 'user-1' },
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
