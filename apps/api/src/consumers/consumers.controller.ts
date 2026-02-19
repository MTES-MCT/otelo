import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/client'
import { ConsumersService } from './consumers.service'

@ApiTags('Admin - Consommateurs')
@Controller('admin/consumers')
export class ConsumersController {
  constructor(private readonly consumersService: ConsumersService) {}

  @AccessControl({ roles: [Role.ADMIN] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un consommateur API' })
  @ApiResponse({ status: 201, description: 'Consommateur cree avec la cle API (affichee une seule fois)' })
  async create(@Body() body: { name: string }) {
    return this.consumersService.create({ name: body.name })
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister les consommateurs API' })
  async list() {
    return this.consumersService.list()
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Detail d'un consommateur API" })
  async get(@Param('id') id: string) {
    return this.consumersService.get(id)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modifier un consommateur API (nom, activation)' })
  async update(@Param('id') id: string, @Body() body: { name?: string; active?: boolean }) {
    return this.consumersService.update(id, {
      name: body.name,
      active: body.active,
    })
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un consommateur API' })
  async delete(@Param('id') id: string) {
    return this.consumersService.delete(id)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Get(':id/key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Voir la clé API d'un consommateur" })
  @ApiResponse({ status: 200, description: 'Clé API déchiffrée' })
  async getKey(@Param('id') id: string) {
    return this.consumersService.getKey(id)
  }

  @AccessControl({ roles: [Role.ADMIN] })
  @Post(':id/regenerate-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Regénérer la cle API d'un consommateur" })
  @ApiResponse({ status: 200, description: 'Nouvelle cle API (affichee une seule fois)' })
  async regenerateKey(@Param('id') id: string) {
    return this.consumersService.regenerateKey(id)
  }
}
