import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Prisma, Role } from '~/generated/prisma/client'
import { PreviewService } from '~/preview/preview.service'
import {
  TPreviewForSimulationBody,
  TPreviewSimulationDto,
  ZPreviewForSimulationBody,
  ZPreviewSimulationDto,
} from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'

@Controller('simulations')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(@Body({ schema: ZPreviewSimulationDto }) dto: TPreviewSimulationDto, @User() { id: userId }: TUser) {
    return this.previewService.calculate(dto, userId)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'simulationId',
    roles: [Role.ADMIN, Role.USER],
  })
  @Post(':simulationId/preview')
  @HttpCode(HttpStatus.OK)
  async previewForSimulation(
    @Param('simulationId') simulationId: string,
    @Body({ schema: ZPreviewForSimulationBody }) body: TPreviewForSimulationBody,
    @User() { id: userId }: TUser,
  ) {
    return this.previewService.calculate({ ...body, simulationId }, userId)
  }
}
