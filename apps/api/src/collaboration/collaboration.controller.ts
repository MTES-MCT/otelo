import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Prisma, Role } from '~/generated/prisma/client'
import { InviteCollaboratorDto } from '~/schemas/collaboration/collaboration'
import { TUser } from '~/schemas/users/user'
import { CollaborationService } from './collaboration.service'

@Controller('simulations')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get(':id/activity')
  @HttpCode(HttpStatus.OK)
  async getActivity(@Param('id') id: string, @Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : undefined
    return this.collaborationService.getActivityHistory(id, Number.isFinite(parsed) ? parsed : undefined)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Get(':id/collaborators')
  @HttpCode(HttpStatus.OK)
  async listCollaborators(@Param('id') id: string) {
    return this.collaborationService.listCollaborators(id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post(':id/collaborators')
  @HttpCode(HttpStatus.CREATED)
  async inviteCollaborator(@Param('id') id: string, @User() user: TUser, @Body() body: InviteCollaboratorDto) {
    return this.collaborationService.inviteByEmail(id, user.id, body.email)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Delete(':id/collaborators/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCollaborator(@Param('id') id: string, @User() user: TUser, @Param('userId') targetUserId: string) {
    return this.collaborationService.removeCollaborator(id, user.id, targetUserId)
  }
}
