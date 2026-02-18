import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Patch, Query, Res } from '@nestjs/common'
import dayjs from 'dayjs'
import { Response } from 'express'
import * as Papa from 'papaparse'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TUpdateUserType } from '~/schemas/users/update-user'
import { TUser } from '~/schemas/users/user'
import { UsersService } from '~/users/users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.usersService.list(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder as 'asc' | 'desc' | undefined,
    )
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Get('search')
  async search(@Query('q') q: string) {
    return this.usersService.search(q ?? '')
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  async exportCsv(@Res() res: Response) {
    const users = await this.usersService.exportCsv()

    const data = users.map((user) => ({
      Nom: user.lastname ?? '',
      Prénom: user.firstname ?? '',
      Email: user.email,
      Rôle: user.role,
      'Date de création': user.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : '',
      'Dernière connexion': user.lastLoginAt ? dayjs(user.lastLoginAt).format('DD/MM/YYYY') : '',
      Accès: user.hasAccess ? 'Oui' : 'Non',
      'Démarches simplifiées': user.engaged ? 'Oui' : 'Non',
    }))

    const dateStr = dayjs().format('DD-MM-YYYY')
    const filename = `export-utilisateurs-${dateStr}.csv`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const csvData = Papa.unparse(data, {
      header: true,
      delimiter: ';',
    })

    res.send(csvData)
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async updateType(@User() user: TUser, @Body() userType: TUpdateUserType) {
    return this.usersService.updateType(user.id, userType)
  }
}
