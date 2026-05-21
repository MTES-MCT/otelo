import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Prisma, Role } from '~/generated/prisma/client'
import { PreviewService } from '~/preview/preview.service'
import { TPreviewSimulationDto, ZPreviewSimulationDto } from '~/schemas/simulations/simulation'
import { TUser } from '~/schemas/users/user'

@Controller('simulations')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(@Body() body: TPreviewSimulationDto, @User() { id: userId }: TUser) {
    const dto = ZPreviewSimulationDto.parse(body)
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
    @Body() body: Omit<TPreviewSimulationDto, 'simulationId'>,
    @User() { id: userId }: TUser,
  ) {
    const dto = ZPreviewSimulationDto.parse({ ...body, simulationId })
    return this.previewService.calculate(dto, userId)
  }
}
