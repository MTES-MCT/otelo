import { Controller, Get } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TEpciGroupWithEpcis } from '~/schemas/epci-group'
import { TUser } from '~/schemas/users/user'
import { EpciGroupsService } from './epci-groups.service'

@Controller('epci-groups')
export class EpciGroupsController {
  constructor(private readonly epciGroupsService: EpciGroupsService) {}

  @AccessControl({
    roles: [Role.USER, Role.ADMIN],
  })
  @Get()
  async findAll(@User() user: TUser): Promise<TEpciGroupWithEpcis[]> {
    return this.epciGroupsService.findAll(user.id)
  }
}
