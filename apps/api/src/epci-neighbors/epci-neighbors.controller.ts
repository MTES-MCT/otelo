import { Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Query } from '@nestjs/common'
import { TEpciNeighborsResponse } from '@shared'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EpciNeighborsService } from '~/epci-neighbors/epci-neighbors.service'
import { NeighborCategory } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'

@Controller('epci-neighbors')
export class EpciNeighborsController {
  constructor(private readonly epciNeighborsService: EpciNeighborsService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
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
