import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import dayjs from 'dayjs'
import { Response } from 'express'
import * as Papa from 'papaparse'
import { z } from 'zod'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TUpdateUserType } from '~/schemas/users/update-user'
import { TUser } from '~/schemas/users/user'
import { resolveUserTypeLabel } from '~/users/user-type.utils'
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
      Référent: user.referent ?? '',
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
  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @HttpCode(HttpStatus.OK)
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    if (!['text/csv', 'application/csv', 'application/vnd.ms-excel'].includes(file.mimetype)) {
      throw new BadRequestException('File must be a CSV')
    }

    const parseResult = Papa.parse<Record<string, string>>(file.buffer.toString('utf-8'), {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      transformHeader: (header) => this.normalizeImportHeader(header),
    })

    if (parseResult.errors.length > 0) {
      throw new BadRequestException(`CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(', ')}`)
    }

    const ZCsvRow = z.object({
      email: z.string().email(),
      nom: z.string().min(1),
      prenom: z.string().min(1),
      referent: z.string().optional(),
      typologie: z.string().optional(),
    })

    const validatedRows: Array<{
      email: string
      referent?: string
      name: string
      firstname: string
      lastname: string
      type?: TUpdateUserType['type']
    }> = []
    const validationErrors: Array<{ row: number; error: string }> = []

    for (let i = 0; i < parseResult.data.length; i++) {
      const result = ZCsvRow.safeParse(parseResult.data[i])
      if (result.success) {
        const resolvedType = result.data.typologie ? resolveUserTypeLabel(result.data.typologie) : null

        if (result.data.typologie && !resolvedType) {
          validationErrors.push({ row: i + 2, error: `Typologie invalide: ${result.data.typologie}` })
          continue
        }

        validatedRows.push({
          email: result.data.email,
          name: `${result.data.prenom} ${result.data.nom}`,
          firstname: result.data.prenom,
          lastname: result.data.nom,
          referent: result.data.referent,
          type: resolvedType ?? undefined,
        })
      } else {
        validationErrors.push({ row: i + 2, error: result.error.issues.map((e) => e.message).join(', ') })
      }
    }

    const importResult = await this.usersService.importUsersFromCsv(validatedRows)

    return {
      ...importResult,
      validationErrors,
      totalRows: parseResult.data.length,
    }
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

  private normalizeImportHeader(header: string): string {
    const normalizedHeader = header.trim().toLowerCase()

    if (normalizedHeader.startsWith('typologie')) {
      return 'typologie'
    }

    return normalizedHeader
  }
}
