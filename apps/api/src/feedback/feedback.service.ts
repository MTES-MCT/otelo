import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { FeedbackStatus } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { TSubmitFeedback } from '~/schemas/feedback/submit-feedback'

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string): Promise<{ status: FeedbackStatus | null; hasSimulations: boolean }> {
    const [feedback, simulationCount] = await Promise.all([
      this.prisma.userFeedback.findUnique({ where: { userId } }),
      this.prisma.simulation.count({ where: { userId } }),
    ])

    return {
      status: feedback?.status ?? null,
      hasSimulations: simulationCount > 0,
    }
  }

  async submit(userId: string, { rating, comment }: TSubmitFeedback) {
    return this.prisma.userFeedback.upsert({
      where: { userId },
      create: { userId, status: FeedbackStatus.SUBMITTED, rating, comment },
      update: { status: FeedbackStatus.SUBMITTED, rating, comment },
    })
  }

  async snooze(userId: string) {
    return this.prisma.userFeedback.upsert({
      where: { userId },
      create: { userId, status: FeedbackStatus.SNOOZED },
      update: { status: FeedbackStatus.SNOOZED },
    })
  }

  async findAllSubmitted(startDate?: string, endDate?: string) {
    return this.prisma.userFeedback.findMany({
      where: {
        status: FeedbackStatus.SUBMITTED,
        user: { role: Role.USER },
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
