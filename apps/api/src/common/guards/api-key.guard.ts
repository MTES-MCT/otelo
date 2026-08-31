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

    this.recordDailyUsage(consumer.id)

    request.apiConsumer = consumer

    return true
  }

  /**
   * Incrémente le compteur journalier du consommateur.
   *
   * Un agrégat par jour plutôt qu'une ligne par requête : `lastUsedAt` seul ne dit pas
   * combien d'appels sont passés, et journaliser chaque requête ferait grossir la base
   * sans usage correspondant.
   *
   * Volontairement non attendu, et silencieux en cas d'échec : la mesure d'usage ne doit
   * jamais empêcher un appel API légitime d'aboutir.
   */
  private recordDailyUsage(apiConsumerId: string): void {
    const day = new Date()
    day.setUTCHours(0, 0, 0, 0)

    this.prisma.apiConsumerUsageDaily
      .upsert({
        where: { apiConsumerId_day: { apiConsumerId, day } },
        create: { apiConsumerId, day, count: 1 },
        update: { count: { increment: 1 } },
      })
      .catch(() => {
        // fire and forget strat: silently ignore
      })
  }
}
