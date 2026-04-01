import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { Request } from 'express'
import { PrismaService } from '~/db/prisma.service'

export interface RequestWithShareSimulationId extends Request {
  shareSimulationId: string
}

@Injectable()
export class ShareTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithShareSimulationId>()
    const token = request.params.token as string | undefined

    if (!token) {
      throw new NotFoundException()
    }

    const shareLink = await this.prisma.simulationShareLink.findUnique({
      where: { token },
    })

    if (!shareLink || !shareLink.active) {
      throw new NotFoundException()
    }

    request.shareSimulationId = shareLink.simulationId
    // Expose simulationId in params so REQUEST-scoped CalculationContext can read it
    request.params.simulationId = shareLink.simulationId

    return true
  }
}
