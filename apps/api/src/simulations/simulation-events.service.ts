import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { map, Observable, Subject } from 'rxjs'
import { PrismaService } from '~/db/prisma.service'

export type SimulationEventType = 'scenario_updated' | 'simulation_deleted' | 'collaborator_joined' | 'collaborator_left'

export interface SimulationEvent {
  type: SimulationEventType
  simulationId: string
  userId: string
  clientId: string
  timestamp: number
  data?: Record<string, unknown> | null
}

const PRESENCE_TTL_MS = 60_000 // 60 seconds
const CLEANUP_INTERVAL_MS = 5 * 60_000 // 5 minutes

@Injectable()
export class SimulationEventsService implements OnModuleDestroy {
  constructor(private readonly prisma: PrismaService) {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS)
  }

  private channels = new Map<string, Subject<SimulationEvent>>()
  private cleanupTimer: NodeJS.Timeout

  onModuleDestroy() {
    clearInterval(this.cleanupTimer)
  }

  getChannel(simulationId: string): Observable<MessageEvent> {
    const subject = this.getOrCreateSubject(simulationId)

    return new Observable<MessageEvent>((subscriber) => {
      const subscription = subject
        .pipe(
          map(
            (event) =>
              ({
                data: JSON.stringify(event),
              }) as MessageEvent,
          ),
        )
        .subscribe(subscriber)

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  emit(event: SimulationEvent): void {
    const subject = this.channels.get(event.simulationId)
    if (subject) {
      subject.next(event)
    }
  }

  /** Upsert presence row — one row per (simulationId, userId) */
  async heartbeat(simulationId: string, userId: string): Promise<void> {
    await this.prisma.simulationPresence.upsert({
      where: { simulationId_userId: { simulationId, userId } },
      update: { lastSeen: new Date() },
      create: { simulationId, userId },
    })
  }

  async disconnect(simulationId: string, userId: string): Promise<void> {
    await this.prisma.simulationPresence.deleteMany({
      where: { simulationId, userId },
    })
  }

  async getConnectionCount(simulationId: string): Promise<number> {
    const cutoff = new Date(Date.now() - PRESENCE_TTL_MS)
    return this.prisma.simulationPresence.count({
      where: { simulationId, lastSeen: { gt: cutoff } },
    })
  }

  async getConnectedUsers(simulationId: string) {
    const cutoff = new Date(Date.now() - PRESENCE_TTL_MS)
    const presences = await this.prisma.simulationPresence.findMany({
      where: { simulationId, lastSeen: { gt: cutoff } },
      select: {
        user: { select: { id: true, firstname: true, lastname: true } },
      },
    })
    const users = presences.map((p) => p.user)
    return { count: users.length, users }
  }

  /** Periodic cleanup: remove stale presence rows and empty SSE channels */
  private async cleanup() {
    const cutoff = new Date(Date.now() - PRESENCE_TTL_MS)
    await this.prisma.simulationPresence.deleteMany({
      where: { lastSeen: { lt: cutoff } },
    })

    for (const [id, subject] of this.channels) {
      if (!subject.observed) {
        this.channels.delete(id)
      }
    }
  }

  private getOrCreateSubject(simulationId: string): Subject<SimulationEvent> {
    let subject = this.channels.get(simulationId)
    if (!subject) {
      subject = new Subject<SimulationEvent>()
      this.channels.set(simulationId, subject)
    }
    return subject
  }
}
