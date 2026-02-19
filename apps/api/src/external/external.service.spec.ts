import { createMock } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { ResultsService } from '~/results/results.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { ExternalService } from './external.service'

describe('ExternalService', () => {
  let service: ExternalService
  let mockPrismaService: jest.Mocked<PrismaService>
  let mockSimulationsService: jest.Mocked<SimulationsService>
  let mockNeedsCalculationService: jest.Mocked<NeedsCalculationService>
  let mockResultsService: jest.Mocked<ResultsService>

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()
    mockSimulationsService = createMock<SimulationsService>()
    mockNeedsCalculationService = createMock<NeedsCalculationService>()
    mockResultsService = createMock<ResultsService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SimulationsService, useValue: mockSimulationsService },
        { provide: NeedsCalculationService, useValue: mockNeedsCalculationService },
        { provide: ResultsService, useValue: mockResultsService },
      ],
    }).compile()

    service = module.get<ExternalService>(ExternalService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createSimulation', () => {
    it('should create a scenario, simulation and return results', async () => {
      const consumerId = 'consumer-1'
      const mockScenario = { id: 'scenario-1' }
      const mockSimulation = { id: 'sim-1' }
      const mockFullSimulation = { id: 'sim-1', name: 'Test', epcis: [], scenario: {} }
      const mockResults = { epcisTotals: [], totals: {} }

      mockPrismaService.scenario.create = jest.fn().mockResolvedValue(mockScenario)
      mockPrismaService.simulation.create = jest.fn().mockResolvedValue(mockSimulation)
      mockSimulationsService.get = jest.fn().mockResolvedValue(mockFullSimulation)
      mockNeedsCalculationService.calculate = jest.fn().mockResolvedValue(mockResults)
      mockResultsService.upsertSimulationResults = jest.fn().mockResolvedValue(undefined)
      mockResultsService.insertResultsHistory = jest.fn().mockResolvedValue(undefined)

      const result = await service.createSimulation(consumerId, {
        name: 'Test Simulation',
        epci: [{ code: '200093201' }],
        scenario: {
          b2_scenario: 'central',
          projection: 2030,
          epcis: {
            '200093201': { b2_tx_rs: 0.1, b2_tx_vacance: 0.05, baseEpci: true },
          },
        } as any,
      })

      expect(result).toEqual({ ...mockFullSimulation, results: mockResults })
      expect(mockPrismaService.scenario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          apiConsumer: { connect: { id: consumerId } },
        }),
      })
    })
  })

  describe('listSimulations', () => {
    it('should return simulations for a consumer', async () => {
      const simulations = [
        { id: 'sim-1', name: 'Sim 1', createdAt: new Date(), updatedAt: new Date(), epcis: [], scenario: {}, epciGroup: null },
      ]
      mockPrismaService.simulation.findMany = jest.fn().mockResolvedValue(simulations)

      const result = await service.listSimulations('consumer-1')

      expect(result).toHaveLength(1)
      expect(mockPrismaService.simulation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { apiConsumerId: 'consumer-1', deleted: null },
        }),
      )
    })
  })

  describe('updateSimulation', () => {
    it('should update scenario fields and recalculate results', async () => {
      const mockFullSimulation = { id: 'sim-1', name: 'Test', epcis: [], scenario: {} }
      const mockResults = { epcisTotals: [], totals: {} }

      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue({ id: 'sim-1', apiConsumerId: 'consumer-1' })
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue({ scenarioId: 'scenario-1' })
      mockPrismaService.scenario.update = jest.fn().mockResolvedValue({})
      mockSimulationsService.get = jest.fn().mockResolvedValue(mockFullSimulation)
      mockNeedsCalculationService.calculate = jest.fn().mockResolvedValue(mockResults)
      mockResultsService.upsertSimulationResults = jest.fn().mockResolvedValue(undefined)
      mockResultsService.insertResultsHistory = jest.fn().mockResolvedValue(undefined)

      const result = await service.updateSimulation('consumer-1', 'sim-1', {
        b2_scenario: 'haut',
        projection: 2040,
      })

      expect(result).toEqual({ ...mockFullSimulation, results: mockResults })
      expect(mockPrismaService.scenario.update).toHaveBeenCalledWith({
        data: { b2_scenario: 'haut', projection: 2040 },
        where: { id: 'scenario-1' },
      })
    })

    it('should update epciScenarios and scenario fields together', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue({ id: 'sim-1', apiConsumerId: 'consumer-1' })
      mockPrismaService.simulation.findUniqueOrThrow = jest.fn().mockResolvedValue({ scenarioId: 'scenario-1' })
      mockPrismaService.scenario.update = jest.fn().mockResolvedValue({})
      mockSimulationsService.get = jest.fn().mockResolvedValue({ id: 'sim-1' })
      mockNeedsCalculationService.calculate = jest.fn().mockResolvedValue({})
      mockResultsService.upsertSimulationResults = jest.fn().mockResolvedValue(undefined)
      mockResultsService.insertResultsHistory = jest.fn().mockResolvedValue(undefined)

      await service.updateSimulation('consumer-1', 'sim-1', {
        b2_scenario: 'bas',
        epciScenarios: {
          '200093201': { b2_tx_vacance: 0.05, b2_tx_rs: 0.1 },
        },
      })

      expect(mockPrismaService.scenario.update).toHaveBeenCalledWith({
        data: {
          b2_scenario: 'bas',
          epciScenarios: {
            updateMany: [
              {
                where: { scenarioId: 'scenario-1', epciCode: '200093201' },
                data: { b2_tx_vacance: 0.05, b2_tx_rs: 0.1 },
              },
            ],
          },
        },
        where: { id: 'scenario-1' },
      })
    })
  })

  describe('deleteSimulation', () => {
    it('should soft-delete a simulation owned by the consumer', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue({ id: 'sim-1', apiConsumerId: 'consumer-1' })
      mockPrismaService.simulation.update = jest.fn().mockResolvedValue({ id: 'sim-1' })

      await service.deleteSimulation('consumer-1', 'sim-1')

      expect(mockPrismaService.simulation.update).toHaveBeenCalledWith({
        where: { id: 'sim-1' },
        data: { deleted: expect.any(Date) },
      })
    })

    it('should throw NotFoundException when simulation not owned by consumer', async () => {
      mockPrismaService.simulation.findFirst = jest.fn().mockResolvedValue(null)

      await expect(service.deleteSimulation('consumer-1', 'sim-1')).rejects.toThrow(NotFoundException)
    })
  })
})
