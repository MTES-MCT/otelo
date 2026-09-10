import { Body, Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common'
import { UpdateUserAccessDto, UpdateUserRegionDto } from '~/admin/admin.dto'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { ExcludeOpenApi } from '~/common/decorators/exclude-open-api.decorator'
import { Role } from '~/generated/prisma/enums'
import { UsersService } from '~/users/users.service'

@Controller('admin')
@ExcludeOpenApi()
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Patch('/users/:id/access')
  async update(@Param('id') id: string, @Body() body: UpdateUserAccessDto) {
    return this.usersService.updateAccess(id, body.hasAccess)
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Patch('/users/:id/region')
  async updateRegion(@Param('id') id: string, @Body() body: UpdateUserRegionDto) {
    return this.usersService.updateRegion(id, body.region)
  }
}
