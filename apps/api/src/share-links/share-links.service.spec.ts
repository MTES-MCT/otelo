import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { EpcisService } from '~/epcis/epcis.service'
import { ResultsService } from '~/results/results.service'
import { SimulationChangesService } from '~/simulations/simulation-changes.service'
import { ShareLinksService } from './share-links.service'

describe('ShareLinksService', () => {
  let service: ShareLinksService
  let mockPrismaService: jest.Mocked<PrismaService>
  let mockResultsService: jest.Mocked<ResultsService>

  beforeEach(async () => {
    mockPrismaService = createMock<PrismaService>()
    mockResultsService = createMock<ResultsService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareLinksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EpcisService, useValue: createMock<EpcisService>() },
        { provide: ResultsService, useValue: mockResultsService },
        { provide: SimulationChangesService, useValue: createMock<SimulationChangesService>() },
      ],
    }).compile()

    service = module.get<ShareLinksService>(ShareLinksService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getShareStatus', () => {
    it('should return inactive when no link exists', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue(null)

      const result = await service.getShareStatus('sim-1')

      expect(result).toEqual({ active: false, token: null })
    })

    it('should return active with token when link is active', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'abc-123',
        simulationId: 'sim-1',
        active: true,
      })

      const result = await service.getShareStatus('sim-1')

      expect(result).toEqual({ active: true, token: 'abc-123' })
    })

    it('should return inactive with null token when link is disabled', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'abc-123',
        simulationId: 'sim-1',
        active: false,
      })

      const result = await service.getShareStatus('sim-1')

      expect(result).toEqual({ active: false, token: null })
    })
  })

  describe('toggleShare', () => {
    it('should create a new link when none exists', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue(null)
      mockPrismaService.simulationShareLink.create = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'new-token',
        simulationId: 'sim-1',
        active: true,
      })

      const result = await service.toggleShare('sim-1')

      expect(result).toEqual({ active: true, token: 'new-token' })
      expect(mockPrismaService.simulationShareLink.create).toHaveBeenCalledWith({
        data: { simulationId: 'sim-1' },
      })
    })

    it('should deactivate an active link', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'old-token',
        simulationId: 'sim-1',
        active: true,
      })
      mockPrismaService.simulationShareLink.update = jest.fn().mockResolvedValue({
        id: 'link-1',
        active: false,
      })

      const result = await service.toggleShare('sim-1')

      expect(result).toEqual({ active: false, token: null })
      expect(mockPrismaService.simulationShareLink.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: { active: false },
      })
    })

    it('should reactivate an inactive link with a new token', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'old-token',
        simulationId: 'sim-1',
        active: false,
      })
      mockPrismaService.simulationShareLink.update = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'brand-new-token',
        active: true,
      })

      const result = await service.toggleShare('sim-1')

      expect(result.active).toBe(true)
      expect(result.token).toBeTruthy()
      // Verify the old token was replaced
      expect(mockPrismaService.simulationShareLink.update).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        data: { active: true, token: expect.any(String) },
      })
    })

    it('should generate a different token on reactivation (old link invalidated)', async () => {
      mockPrismaService.simulationShareLink.findUnique = jest.fn().mockResolvedValue({
        id: 'link-1',
        token: 'old-token',
        simulationId: 'sim-1',
        active: false,
      })
      mockPrismaService.simulationShareLink.update = jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'link-1' }))

      await service.toggleShare('sim-1')

      const updateCall = mockPrismaService.simulationShareLink.update.mock.calls[0][0] as any
      expect(updateCall.data.token).not.toBe('old-token')
    })
  })

  describe('getResultsByToken', () => {
    beforeEach(() => {
      mockPrismaService.simulationShareLink.updateMany = jest.fn().mockResolvedValue({ count: 1 })
    })

    it('should delegate to ResultsService.getGroupedResults', async () => {
      const mockResults = { name: 'test', simulations: {} }
      mockResultsService.getGroupedResults = jest.fn().mockResolvedValue(mockResults)

      const result = await service.getResultsByToken('sim-1')

      expect(result).toEqual(mockResults)
      expect(mockResultsService.getGroupedResults).toHaveBeenCalledWith('sim-1')
    })

    it('should count the view', async () => {
      mockResultsService.getGroupedResults = jest.fn().mockResolvedValue({})

      await service.getResultsByToken('sim-1')

      expect(mockPrismaService.simulationShareLink.updateMany).toHaveBeenCalledWith({
        where: { simulationId: 'sim-1' },
        data: { viewCount: { increment: 1 }, lastViewedAt: expect.any(Date) },
      })
    })

    it('should still serve the results when counting the view fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const mockResults = { name: 'test', simulations: {} }
      mockPrismaService.simulationShareLink.updateMany = jest.fn().mockRejectedValue(new Error('db down'))
      mockResultsService.getGroupedResults = jest.fn().mockResolvedValue(mockResults)

      await expect(service.getResultsByToken('sim-1')).resolves.toEqual(mockResults)

      consoleError.mockRestore()
    })
  })

  describe('recordShareView', () => {
    it('should never throw, so a failed counter cannot break the public page', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockPrismaService.simulationShareLink.updateMany = jest.fn().mockRejectedValue(new Error('db down'))

      await expect(service.recordShareView('sim-1')).resolves.toBeUndefined()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })
})
