import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { SimulationEventsService } from './simulation-events.service'

describe('SimulationEventsService', () => {
  let service: SimulationEventsService
  let mockPrisma: DeepMocked<PrismaService>

  const simulationId = 'sim-1'
  const userId = 'user-1'

  beforeEach(async () => {
    mockPrisma = createMock<PrismaService>()

    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulationEventsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()

    service = module.get<SimulationEventsService>(SimulationEventsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    service.onModuleDestroy()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('heartbeat', () => {
    it('should upsert presence with simulationId and userId', async () => {
      mockPrisma.simulationPresence.upsert = jest.fn().mockResolvedValue({})

      await service.heartbeat(simulationId, userId)

      expect(mockPrisma.simulationPresence.upsert).toHaveBeenCalledWith({
        where: { simulationId_userId: { simulationId, userId } },
        update: { lastSeen: expect.any(Date) },
        create: { simulationId, userId },
      })
    })

    it('should deduplicate by (simulationId, userId) — no clientId', async () => {
      mockPrisma.simulationPresence.upsert = jest.fn().mockResolvedValue({})

      // Same user heartbeating multiple times should always use the same unique key
      await service.heartbeat(simulationId, userId)
      await service.heartbeat(simulationId, userId)

      const calls = (mockPrisma.simulationPresence.upsert as jest.Mock).mock.calls
      expect(calls).toHaveLength(2)
      expect(calls[0][0].where).toEqual(calls[1][0].where)
    })
  })

  describe('disconnect', () => {
    it('should delete presence row for the user', async () => {
      mockPrisma.simulationPresence.deleteMany = jest.fn().mockResolvedValue({ count: 1 })

      await service.disconnect(simulationId, userId)

      expect(mockPrisma.simulationPresence.deleteMany).toHaveBeenCalledWith({
        where: { simulationId, userId },
      })
    })
  })

  describe('getConnectionCount', () => {
    it('should count active presences within TTL window', async () => {
      mockPrisma.simulationPresence.count = jest.fn().mockResolvedValue(3)

      const count = await service.getConnectionCount(simulationId)

      expect(count).toBe(3)
      expect(mockPrisma.simulationPresence.count).toHaveBeenCalledWith({
        where: {
          simulationId,
          lastSeen: { gt: expect.any(Date) },
        },
      })
    })

    it('should use a cutoff date ~60s in the past', async () => {
      mockPrisma.simulationPresence.count = jest.fn().mockResolvedValue(0)
      const before = Date.now()

      await service.getConnectionCount(simulationId)

      const call = (mockPrisma.simulationPresence.count as jest.Mock).mock.calls[0][0]
      const cutoff = call.where.lastSeen.gt as Date
      const cutoffMs = cutoff.getTime()
      // Cutoff should be approximately now - 60s
      expect(cutoffMs).toBeGreaterThanOrEqual(before - 61_000)
      expect(cutoffMs).toBeLessThanOrEqual(before - 59_000)
    })
  })

  describe('getConnectedUsers', () => {
    it('should return users with id, firstname, lastname only', async () => {
      const mockPresences = [
        { user: { id: 'u1', firstname: 'Jean', lastname: 'Dupont' } },
        { user: { id: 'u2', firstname: 'Marie', lastname: 'Martin' } },
      ]
      mockPrisma.simulationPresence.findMany = jest.fn().mockResolvedValue(mockPresences)

      const result = await service.getConnectedUsers(simulationId)

      expect(result.count).toBe(2)
      expect(result.users).toEqual([
        { id: 'u1', firstname: 'Jean', lastname: 'Dupont' },
        { id: 'u2', firstname: 'Marie', lastname: 'Martin' },
      ])
    })

    it('should not select email from users', async () => {
      mockPrisma.simulationPresence.findMany = jest.fn().mockResolvedValue([])

      await service.getConnectedUsers(simulationId)

      const call = (mockPrisma.simulationPresence.findMany as jest.Mock).mock.calls[0][0]
      expect(call.select.user.select).not.toHaveProperty('email')
    })
  })

  describe('emit', () => {
    it('should emit event to subscribers on an active channel', (done) => {
      // Create a channel by subscribing
      const observable = service.getChannel(simulationId)
      const event = {
        type: 'scenario_updated' as const,
        simulationId,
        userId,
        clientId: 'c1',
        timestamp: Date.now(),
      }

      const sub = observable.subscribe((msg) => {
        expect(JSON.parse(msg.data as string)).toEqual(event)
        sub.unsubscribe()
        done()
      })

      service.emit(event)
    })

    it('should not throw when emitting to a non-existent channel', () => {
      expect(() =>
        service.emit({
          type: 'scenario_updated',
          simulationId: 'non-existent',
          userId,
          clientId: '',
          timestamp: Date.now(),
        }),
      ).not.toThrow()
    })
  })

  describe('getChannel', () => {
    it('should return an observable', () => {
      const channel = service.getChannel(simulationId)
      expect(channel).toBeDefined()
      expect(channel.subscribe).toBeDefined()
    })

    it('should reuse the same subject for the same simulationId', () => {
      const channel1 = service.getChannel(simulationId)
      const channel2 = service.getChannel(simulationId)
      // Both should receive the same events
      const received1: unknown[] = []
      const received2: unknown[] = []

      const sub1 = channel1.subscribe((msg) => received1.push(msg))
      const sub2 = channel2.subscribe((msg) => received2.push(msg))

      service.emit({
        type: 'scenario_updated',
        simulationId,
        userId,
        clientId: '',
        timestamp: Date.now(),
      })

      expect(received1).toHaveLength(1)
      expect(received2).toHaveLength(1)

      sub1.unsubscribe()
      sub2.unsubscribe()
    })
  })
})
