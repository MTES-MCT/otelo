import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { FeedbackStatus } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { FeedbackService } from './feedback.service'

describe('FeedbackService', () => {
  let service: FeedbackService
  let prismaService: jest.Mocked<PrismaService>

  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<FeedbackService>(FeedbackService)
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getStatus', () => {
    it('should return null status and hasSimulations false when no feedback and no simulations', async () => {
      prismaService.userFeedback.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.simulation.count = jest.fn().mockResolvedValue(0)

      const result = await service.getStatus('user-1')
      expect(result).toEqual({ status: null, hasSimulations: false })
      expect(prismaService.userFeedback.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(prismaService.simulation.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
    })

    it('should return SNOOZED status and hasSimulations true', async () => {
      prismaService.userFeedback.findUnique = jest.fn().mockResolvedValue({
        id: 'fb-1',
        userId: 'user-1',
        status: FeedbackStatus.SNOOZED,
        rating: null,
        comment: null,
      })
      prismaService.simulation.count = jest.fn().mockResolvedValue(3)

      const result = await service.getStatus('user-1')
      expect(result).toEqual({ status: 'SNOOZED', hasSimulations: true })
    })

    it('should return SUBMITTED status', async () => {
      prismaService.userFeedback.findUnique = jest.fn().mockResolvedValue({
        id: 'fb-1',
        userId: 'user-1',
        status: FeedbackStatus.SUBMITTED,
        rating: 4,
        comment: 'Great app',
      })
      prismaService.simulation.count = jest.fn().mockResolvedValue(1)

      const result = await service.getStatus('user-1')
      expect(result).toEqual({ status: 'SUBMITTED', hasSimulations: true })
    })
  })

  describe('submit', () => {
    it('should upsert feedback with SUBMITTED status', async () => {
      const mockFeedback = {
        id: 'fb-1',
        userId: 'user-1',
        status: FeedbackStatus.SUBMITTED,
        rating: 4,
        comment: 'Great app',
      }
      prismaService.userFeedback.upsert = jest.fn().mockResolvedValue(mockFeedback)

      const result = await service.submit('user-1', { rating: 4, comment: 'Great app' })
      expect(result).toEqual(mockFeedback)
      expect(prismaService.userFeedback.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', status: FeedbackStatus.SUBMITTED, rating: 4, comment: 'Great app' },
        update: { status: FeedbackStatus.SUBMITTED, rating: 4, comment: 'Great app' },
      })
    })

    it('should upsert feedback without comment', async () => {
      const mockFeedback = {
        id: 'fb-1',
        userId: 'user-1',
        status: FeedbackStatus.SUBMITTED,
        rating: 3,
        comment: undefined,
      }
      prismaService.userFeedback.upsert = jest.fn().mockResolvedValue(mockFeedback)

      const result = await service.submit('user-1', { rating: 3 })
      expect(result).toEqual(mockFeedback)
      expect(prismaService.userFeedback.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', status: FeedbackStatus.SUBMITTED, rating: 3, comment: undefined },
        update: { status: FeedbackStatus.SUBMITTED, rating: 3, comment: undefined },
      })
    })
  })

  describe('snooze', () => {
    it('should upsert feedback with SNOOZED status', async () => {
      const mockFeedback = {
        id: 'fb-1',
        userId: 'user-1',
        status: FeedbackStatus.SNOOZED,
        rating: null,
        comment: null,
      }
      prismaService.userFeedback.upsert = jest.fn().mockResolvedValue(mockFeedback)

      const result = await service.snooze('user-1')
      expect(result).toEqual(mockFeedback)
      expect(prismaService.userFeedback.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1', status: FeedbackStatus.SNOOZED },
        update: { status: FeedbackStatus.SNOOZED },
      })
    })
  })

  describe('findAllSubmitted', () => {
    it('should return submitted feedbacks from users without date filter', async () => {
      const mockFeedbacks = [
        { id: 'fb-1', rating: 5, comment: 'Super', user: { email: 'a@b.com' } },
        { id: 'fb-2', rating: 3, comment: null, user: { email: 'c@d.com' } },
      ]
      prismaService.userFeedback.findMany = jest.fn().mockResolvedValue(mockFeedbacks)

      const result = await service.findAllSubmitted()
      expect(result).toEqual(mockFeedbacks)
      expect(prismaService.userFeedback.findMany).toHaveBeenCalledWith({
        where: { status: FeedbackStatus.SUBMITTED, user: { role: Role.USER } },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by startDate and endDate', async () => {
      prismaService.userFeedback.findMany = jest.fn().mockResolvedValue([])

      await service.findAllSubmitted('2025-01-01', '2025-12-31')
      expect(prismaService.userFeedback.findMany).toHaveBeenCalledWith({
        where: {
          status: FeedbackStatus.SUBMITTED,
          user: { role: Role.USER },
          createdAt: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-12-31'),
          },
        },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by startDate only', async () => {
      prismaService.userFeedback.findMany = jest.fn().mockResolvedValue([])

      await service.findAllSubmitted('2025-06-01')
      expect(prismaService.userFeedback.findMany).toHaveBeenCalledWith({
        where: {
          status: FeedbackStatus.SUBMITTED,
          user: { role: Role.USER },
          createdAt: {
            gte: new Date('2025-06-01'),
          },
        },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      })
    })
  })
})
