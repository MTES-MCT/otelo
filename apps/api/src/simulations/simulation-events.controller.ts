import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Sse } from '@nestjs/common'
import { SkipThrottle, Throttle } from '@nestjs/throttler'
import { Observable } from 'rxjs'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Prisma, Role } from '~/generated/prisma/client'
import { TUser } from '~/schemas/users/user'
import { SimulationEventsService } from './simulation-events.service'

@Controller('simulations')
export class SimulationEventsController {
  constructor(private readonly simulationEventsService: SimulationEventsService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @SkipThrottle()
  @Sse(':id/events')
  events(@Param('id') id: string): Observable<MessageEvent> {
    return this.simulationEventsService.getChannel(id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get(':id/connections')
  @HttpCode(HttpStatus.OK)
  async getConnectedUsers(@Param('id') id: string) {
    return this.simulationEventsService.getConnectedUsers(id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Param('id') id: string, @User() user: TUser) {
    await this.simulationEventsService.heartbeat(id, user.id)
    return { count: await this.simulationEventsService.getConnectionCount(id) }
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  @Delete(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  async disconnect(@Param('id') id: string, @User() user: TUser) {
    await this.simulationEventsService.disconnect(id, user.id)
    return { success: true }
  }
}
