import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '~/db/prisma.service'
import { ResultsService } from '~/results/results.service'

@Injectable()
export class ShareLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
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

  async toggleShare(simulationId: string) {
    const existing = await this.prisma.simulationShareLink.findUnique({
      where: { simulationId },
    })

    if (!existing) {
      const link = await this.prisma.simulationShareLink.create({
        data: { simulationId },
      })
      return { active: true, token: link.token }
    }

    if (existing.active) {
      await this.prisma.simulationShareLink.update({
        where: { id: existing.id },
        data: { active: false },
      })
      return { active: false, token: null }
    }

    const link = await this.prisma.simulationShareLink.update({
      where: { id: existing.id },
      data: { active: true, token: randomUUID() },
    })
    return { active: true, token: link.token }
  }

  async getResultsByToken(simulationId: string) {
    return this.resultsService.getGroupedResults(simulationId)
  }
}
