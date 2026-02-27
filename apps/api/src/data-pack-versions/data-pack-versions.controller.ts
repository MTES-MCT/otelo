import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/client'
import { DataPackVersionsService } from './data-pack-versions.service'

@Controller('data-pack-versions')
export class DataPackVersionsController {
  constructor(private readonly dataPackVersionsService: DataPackVersionsService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return this.dataPackVersionsService.getAll()
  }
}
