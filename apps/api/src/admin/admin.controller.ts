import { Body, Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common'
import { TUpdateUserAccess, TUpdateUserRegion, ZUpdateUserAccess, ZUpdateUserRegion } from '~/admin/admin.dto'
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
  async update(@Param('id') id: string, @Body({ schema: ZUpdateUserAccess }) body: TUpdateUserAccess) {
    return this.usersService.updateAccess(id, body.hasAccess)
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Patch('/users/:id/region')
  async updateRegion(@Param('id') id: string, @Body({ schema: ZUpdateUserRegion }) body: TUpdateUserRegion) {
    return this.usersService.updateRegion(id, body.region)
  }
}
