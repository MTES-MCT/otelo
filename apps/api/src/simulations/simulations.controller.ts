import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Prisma, Role } from '~/generated/prisma/client'
import { TUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { TInitSimulation } from '~/schemas/simulations/create-simulation'
import { TCloneSimulationDto } from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'

@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @HttpCode(HttpStatus.OK)
  @Get('dashboard-list')
  async getDashboardList(@User() { id: userId }: TUser) {
    return this.simulationsService.getDashboardList(userId)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':id/scenario')
  @HttpCode(HttpStatus.OK)
  async getSimulationScenario(@Param('id') id: string) {
    return this.simulationsService.getScenario(id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSimulation(@User() user: TUser, @Param('id') id: string) {
    return this.simulationsService.get(id)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: TInitSimulation, @User() { id: userId }: TUser) {
    return this.simulationsService.create(userId, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Put(':id/scenario')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateSimulation(@Param('id') id: string, @Body() data: TUpdateSimulationDto) {
    return this.simulationsService.update(id, data)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSimulation(@Param('id') id: string, @User() { id: userId }: TUser) {
    return this.simulationsService.delete(userId, id)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'id',
    roles: [Role.ADMIN, Role.USER],
  })
  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  async cloneSimulation(@Param('id') id: string, @Body() data: TCloneSimulationDto, @User() { id: userId }: TUser) {
    return this.simulationsService.clone(userId, id, data)
  }
}
