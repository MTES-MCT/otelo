import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '~/db/prisma.service'
import { ResultsService } from '~/results/results.service'
import { SimulationChangesService } from '~/simulations/simulation-changes.service'

@Injectable()
export class ShareLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly simulationChangesService: SimulationChangesService,
  ) {}

  async getShareStatus(simulationId: string) {
    const link = await this.prisma.simulationShareLink.findUnique({
      where: { simulationId },
    })

    return {
      active: link?.active ?? false,
      token: link?.active ? link.token : null,
    }
  }

  async toggleShare(simulationId: string, userId?: string) {
    const existing = await this.prisma.simulationShareLink.findUnique({
      where: { simulationId },
    })

    if (!existing) {
      const link = await this.prisma.simulationShareLink.create({
        data: { simulationId },
      })
      await this.simulationChangesService.record({ simulationId, userId, action: 'share.enabled' })
      return { active: true, token: link.token }
    }

    if (existing.active) {
      await this.prisma.simulationShareLink.update({
        where: { id: existing.id },
        data: { active: false },
      })
      await this.simulationChangesService.record({ simulationId, userId, action: 'share.disabled' })
      return { active: false, token: null }
    }

    const link = await this.prisma.simulationShareLink.update({
      where: { id: existing.id },
      data: { active: true, token: randomUUID() },
    })
    await this.simulationChangesService.record({ simulationId, userId, action: 'share.enabled' })
    return { active: true, token: link.token }
  }

  async getResultsByToken(simulationId: string) {
    void this.recordShareView(simulationId)

    return this.resultsService.getGroupedResults(simulationId)
  }

  async recordShareView(simulationId: string) {
    try {
      await this.prisma.simulationShareLink.updateMany({
        where: { simulationId },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('[share-links] Failed to record share view', error)
    }
  }
}
