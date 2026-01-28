import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TCloneSimulationDto } from '~/schemas/simulations/simulation'
import { SimulationsService } from './simulations.service'

describe('SimulationsService', () => {
  let service: SimulationsService
  let mockPrismaService: jest.Mocked<PrismaService>
  let mockScenariosService: jest.Mocked<ScenariosService>

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()
    mockScenariosService = createMock<ScenariosService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ScenariosService,
          useValue: mockScenariosService,
        },
      ],
    }).compile()

    service = module.get<SimulationsService>(SimulationsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('clone', () => {
    const userId = 'user-123'
    const originalId = 'simulation-456'
    const cloneData: TCloneSimulationDto = { name: 'Cloned Simulation' }

    const mockOriginalSimulation = {
      id: originalId,
      name: 'Original Simulation',
      userId,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      scenario: {
        id: 'scenario-789',
        b2_scenario: 'scenario_central',
        projection: 2030,
        b1_horizon_resorption: 10,
        b11_part_etablissement: 0.5,
        epciScenarios: [
          {
            epciCode: 'EPCI001',
            b2_tx_rs: 0.15,
            b2_tx_vacance: 0.08,
            b2_tx_disparition: 0.02,
            b2_tx_restructuration: 0.01,
          },
          {
            epciCode: 'EPCI002',
            b2_tx_rs: 0.12,
            b2_tx_vacance: 0.06,
            b2_tx_disparition: 0.015,
            b2_tx_restructuration: 0.008,
          },
        ],
      },
      epcis: [{ code: 'EPCI001' }, { code: 'EPCI002' }],
    }

    const mockClonedScenario = {
      id: 'cloned-scenario-999',
      b2_scenario: 'scenario_central',
      projection: 2030,
    }

    const mockClonedSimulation = {
      id: 'cloned-simulation-888',
      name: cloneData.name,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should successfully clone a simulation with all scenario data', async () => {
      // Arrange
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(mockOriginalSimulation)
      mockScenariosService.create = jest.fn().mockResolvedValue(mockClonedScenario)
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue(mockClonedSimulation)

      // Act
      const result = await service.clone(userId, originalId, cloneData)

      // Assert - Focus on behavior, not implementation
      expect(result).toEqual(mockClonedSimulation)

      // Verify a new scenario is created with the user and original scenario data
      expect(mockScenariosService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          // Should preserve key scenario properties
          b2_scenario: mockOriginalSimulation.scenario.b2_scenario,
          projection: mockOriginalSimulation.scenario.projection,
          b1_horizon_resorption: mockOriginalSimulation.scenario.b1_horizon_resorption,
          // Should transform epciScenarios into epcis format
          epcis: expect.any(Object),
        }),
      )

      // Verify a new simulation is created with the cloned scenario
      expect(mockPrismaService.simulation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: cloneData.name,
            scenario: { connect: { id: mockClonedScenario.id } },
            user: { connect: { id: userId } },
            epcis: expect.objectContaining({
              connect: expect.arrayContaining([{ code: 'EPCI001' }, { code: 'EPCI002' }]),
            }),
          }),
        }),
      )
    })

    it('should throw error when original simulation is not found', async () => {
      // Arrange
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockRejectedValue(new Error('Simulation not found'))

      // Act & Assert
      await expect(service.clone(userId, 'non-existent-id', cloneData)).rejects.toThrow('Simulation not found')
    })

    it('should throw error when user does not own the original simulation', async () => {
      // Arrange
      const unauthorizedUserId = 'unauthorized-user'
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockRejectedValue(new Error('Simulation not found'))

      // Act & Assert
      await expect(service.clone(unauthorizedUserId, originalId, cloneData)).rejects.toThrow('Simulation not found')
    })

    it('should handle simulation with no EPCI scenarios', async () => {
      // Arrange
      const simulationWithoutEpciScenarios = {
        ...mockOriginalSimulation,
        scenario: {
          ...mockOriginalSimulation.scenario,
          epciScenarios: [],
        },
      }

      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(simulationWithoutEpciScenarios)
      mockScenariosService.create = jest.fn().mockResolvedValue(mockClonedScenario)
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue(mockClonedSimulation)

      // Act
      const result = await service.clone(userId, originalId, cloneData)

      // Assert
      expect(result).toEqual(mockClonedSimulation)
      expect(mockScenariosService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          epcis: {},
        }),
      )
    })

    it('should handle scenario creation failure', async () => {
      // Arrange
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(mockOriginalSimulation)
      mockScenariosService.create = jest.fn().mockRejectedValue(new Error('Scenario creation failed'))

      // Act & Assert
      await expect(service.clone(userId, originalId, cloneData)).rejects.toThrow('Scenario creation failed')
    })

    it('should handle simulation creation failure', async () => {
      // Arrange
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(mockOriginalSimulation)
      mockScenariosService.create = jest.fn().mockResolvedValue(mockClonedScenario)
      mockPrismaService.simulation.create = jest.fn().mockRejectedValue(new Error('Simulation creation failed'))

      // Act & Assert
      await expect(service.clone(userId, originalId, cloneData)).rejects.toThrow('Simulation creation failed')
    })

    it('should preserve all scenario properties when cloning', async () => {
      // Arrange
      const complexScenario = {
        ...mockOriginalSimulation.scenario,
        b1_horizon_resorption: 15,
        b11_part_etablissement: 0.75,
        b12_cohab_interg_subie: 0.3,
        b13_taux_effort: 0.25,
        b14_taux_reallocation: 0.4,
        source_b11: 'INSEE',
        source_b14: 'FILOCOM',
        epciScenarios: mockOriginalSimulation.scenario.epciScenarios,
      }

      const simulationWithComplexScenario = {
        ...mockOriginalSimulation,
        scenario: complexScenario,
      }

      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(simulationWithComplexScenario)
      mockScenariosService.create = jest.fn().mockResolvedValue(mockClonedScenario)
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue(mockClonedSimulation)

      // Act
      const result = await service.clone(userId, originalId, cloneData)

      // Assert
      expect(result).toEqual(mockClonedSimulation)
      expect(mockScenariosService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          // Verify key complex properties are preserved
          b1_horizon_resorption: 15,
          b11_part_etablissement: 0.75,
          b12_cohab_interg_subie: 0.3,
          b13_taux_effort: 0.25,
          b14_taux_reallocation: 0.4,
          source_b11: 'INSEE',
          source_b14: 'FILOCOM',
          epcis: expect.any(Object),
        }),
      )
    })
  })

  describe('hasUserAccessTo', () => {
    it('should return true when a simulation is found', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue({ id: 'simulation-1' })
      const result = await service.hasUserAccessTo('simulation-1', 'user-1')
      expect(result).toBe(true)
    })

    it('should return false when no simulation is found', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue(null)
      const result = await service.hasUserAccessTo('simulation-1', 'user-1')
      expect(result).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete a simulation', async () => {
      mockPrismaService.simulation.delete = jest.fn().mockResolvedValue({ id: 'simulation-1' })
      const result = await service.delete('user-1', 'simulation-1')
      expect(result).toEqual({ id: 'simulation-1' })
    })
  })
})
