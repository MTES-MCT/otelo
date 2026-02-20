import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { createHash } from 'crypto'
import { Request } from 'express'
import { PrismaService } from '~/db/prisma.service'
import { ApiConsumer } from '~/generated/prisma/client'

interface RequestWithApiConsumer extends Request {
  apiConsumer: ApiConsumer
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiConsumer>()
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer otelo_')) {
      throw new UnauthorizedException('Missing or invalid API key')
    }

    const apiKey = authHeader.split('Bearer ')[1]
    const hashedKey = createHash('sha256').update(apiKey).digest('hex')

    const consumer = await this.prisma.apiConsumer.findUnique({
      where: { hashedKey },
    })

    if (!consumer) {
      throw new UnauthorizedException('Invalid API key')
    }

    if (!consumer.active) {
      throw new UnauthorizedException('API key is disabled')
    }

    this.prisma.apiConsumer
      .update({
        where: { id: consumer.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // fire and forget strat: silently ignore
      })

    request.apiConsumer = consumer

    return true
  }
}
