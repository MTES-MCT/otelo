import { Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Query, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TEpciNeighborsResponse } from '@shared'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EpciNeighborsService } from '~/epci-neighbors/epci-neighbors.service'
import { EpciNeighborsAccessGuard } from '~/epci-neighbors/guards/epci-neighbors-access.guard'
import { NeighborCategory } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'

@Controller('epci-neighbors')
export class EpciNeighborsController {
  private readonly allowedEmails: string[]

  constructor(
    private readonly epciNeighborsService: EpciNeighborsService,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<string>('EPCI_NEIGHBORS_ALLOWED_EMAILS') ?? ''
    this.allowedEmails = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('access-check')
  @HttpCode(HttpStatus.OK)
  checkAccess(@User() user: TUser): { hasAccess: boolean } {
    if (user.role === Role.ADMIN) {
      return { hasAccess: true }
    }

    return { hasAccess: this.allowedEmails.includes(user.email.toLowerCase()) }
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @UseGuards(EpciNeighborsAccessGuard)
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  async getNeighbors(@Param('code') code: string, @Query('category') category?: NeighborCategory): Promise<TEpciNeighborsResponse> {
    try {
      return await this.epciNeighborsService.getNeighborsByEpciCode(code, category)
    } catch (error) {
      throw new NotFoundException(`Neighbors for EPCI ${code} not found`, { cause: error })
    }
  }
}
