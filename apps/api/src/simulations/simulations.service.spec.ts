import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { AccommodationRatesService } from '~/accommodation-rates/accommodation-rates.service'
import { PrismaService } from '~/db/prisma.service'
import { EpciGroupsService } from '~/epci-groups/epci-groups.service'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TCloneSimulationDto } from '~/schemas/simulations/simulation'
import { SimulationsService } from './simulations.service'

describe('SimulationsService', () => {
  let service: SimulationsService
  let mockPrismaService: DeepMocked<PrismaService>
  let mockScenariosService: DeepMocked<ScenariosService>
  let mockEpciGroupsService: DeepMocked<EpciGroupsService>

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()
    mockScenariosService = createMock<ScenariosService>()
    mockEpciGroupsService = createMock<EpciGroupsService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ScenariosService, useValue: mockScenariosService },
        { provide: EpciGroupsService, useValue: mockEpciGroupsService },
        { provide: AccommodationRatesService, useValue: createMock<AccommodationRatesService>() },
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
        millesime: '2022',
        epciScenarios: [
          {
            epciCode: 'EPCI001',
            b2_tx_rs: 0.15,
            b2_tx_vacance: 0.08,
            b2_tx_vacance_longue: 0.06,
            b2_tx_vacance_courte: 0.02,
            b2_tx_disparition: 0.02,
            b2_tx_restructuration: 0.01,
            baseEpci: true,
          },
          {
            epciCode: 'EPCI002',
            b2_tx_rs: 0.12,
            b2_tx_vacance: 0.06,
            b2_tx_vacance_longue: 0.04,
            b2_tx_vacance_courte: 0.02,
            b2_tx_disparition: 0.015,
            b2_tx_restructuration: 0.008,
            baseEpci: false,
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
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(mockOriginalSimulation)
      mockScenariosService.create = jest.fn().mockResolvedValue(mockClonedScenario)
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue(mockClonedSimulation)

      const result = await service.clone(userId, originalId, cloneData)

      expect(result).toEqual(mockClonedSimulation)
      expect(mockScenariosService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          b2_scenario: mockOriginalSimulation.scenario.b2_scenario,
          projection: mockOriginalSimulation.scenario.projection,
          b1_horizon_resorption: mockOriginalSimulation.scenario.b1_horizon_resorption,
          epcis: expect.any(Object),
        }),
        mockOriginalSimulation.scenario.millesime,
      )
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
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockRejectedValue(new Error('Simulation not found'))

      await expect(service.clone(userId, 'non-existent-id', cloneData)).rejects.toThrow('Simulation not found')
    })

    it('should handle simulation with no EPCI scenarios', async () => {
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

      const result = await service.clone(userId, originalId, cloneData)

      expect(result).toEqual(mockClonedSimulation)
      expect(mockScenariosService.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          epcis: {},
        }),
        mockOriginalSimulation.scenario.millesime,
      )
    })

    it('should handle scenario creation failure', async () => {
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue(mockOriginalSimulation)
      mockScenariosService.create = jest.fn().mockRejectedValue(new Error('Scenario creation failed'))

      await expect(service.clone(userId, originalId, cloneData)).rejects.toThrow('Scenario creation failed')
    })
  })

  describe('create', () => {
    const userId = 'user-1'

    const buildInitSimulation = (overrides: Partial<TInitSimulation>): TInitSimulation =>
      ({
        name: 'Scénario',
        epci: [{ code: '200040392' }],
        scenario: {},
        ...overrides,
      }) as TInitSimulation

    beforeEach(() => {
      jest.clearAllMocks()
      mockScenariosService.create = jest.fn().mockResolvedValue({ id: 'scenario-1' })
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue({ id: 'simulation-1' })
    })

    it('should forward worksOnPlanningDocument when creating a new group', async () => {
      mockEpciGroupsService.create = jest.fn().mockResolvedValue({ id: 'group-1' })

      await service.create(userId, buildInitSimulation({ epciGroupName: 'SCoT du Grand Périgueux', worksOnPlanningDocument: true }))

      expect(mockEpciGroupsService.create).toHaveBeenCalledWith(userId, {
        name: 'SCoT du Grand Périgueux',
        epciCodes: ['200040392'],
        worksOnPlanningDocument: true,
      })
    })

    it('should mark an existing group when the user declares working on a planning document', async () => {
      mockEpciGroupsService.hasUserAccessTo = jest.fn().mockResolvedValue(true)

      await service.create(userId, buildInitSimulation({ epciGroupId: 'group-1', worksOnPlanningDocument: true }))

      expect(mockEpciGroupsService.markWorksOnPlanningDocument).toHaveBeenCalledWith('group-1', userId)
    })

    it.each([[false], [null], [undefined]])('should not downgrade an existing group when the answer is %s', async (answer) => {
      mockEpciGroupsService.hasUserAccessTo = jest.fn().mockResolvedValue(true)

      await service.create(userId, buildInitSimulation({ epciGroupId: 'group-1', worksOnPlanningDocument: answer }))

      expect(mockEpciGroupsService.markWorksOnPlanningDocument).not.toHaveBeenCalled()
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
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should soft-delete a simulation without a group', async () => {
      mockPrismaService.simulation.update = jest.fn().mockResolvedValue({ id: 'simulation-1', epciGroupId: null })
      const result = await service.delete('user-1', 'simulation-1')
      expect(result).toEqual({ id: 'simulation-1', epciGroupId: null })
      expect(mockPrismaService.simulation.update).toHaveBeenCalledWith({
        where: { id: 'simulation-1', userId: 'user-1' },
        data: { deleted: expect.any(Date) },
      })
      expect(mockPrismaService.simulation.count).not.toHaveBeenCalled()
      expect(mockPrismaService.epciGroup.update).not.toHaveBeenCalled()
    })

    it('should soft-delete the group when the last simulation in it is deleted', async () => {
      mockPrismaService.simulation.update = jest.fn().mockResolvedValue({ id: 'simulation-1', epciGroupId: 'group-1' })
      mockPrismaService.simulation.count = jest.fn().mockResolvedValue(0)
      mockPrismaService.epciGroup.update = jest.fn().mockResolvedValue({ id: 'group-1' })

      await service.delete('user-1', 'simulation-1')

      expect(mockPrismaService.simulation.count).toHaveBeenCalledWith({
        where: { epciGroupId: 'group-1', deleted: null },
      })
      expect(mockPrismaService.epciGroup.update).toHaveBeenCalledWith({
        where: { id: 'group-1' },
        data: { deleted: expect.any(Date) },
      })
    })

    it('should not soft-delete the group when other simulations remain', async () => {
      mockPrismaService.simulation.update = jest.fn().mockResolvedValue({ id: 'simulation-1', epciGroupId: 'group-1' })
      mockPrismaService.simulation.count = jest.fn().mockResolvedValue(2)

      await service.delete('user-1', 'simulation-1')

      expect(mockPrismaService.simulation.count).toHaveBeenCalledWith({
        where: { epciGroupId: 'group-1', deleted: null },
      })
      expect(mockPrismaService.epciGroup.update).not.toHaveBeenCalled()
    })
  })
})
