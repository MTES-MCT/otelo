import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/client'
import { PreviewService } from '~/results/preview.service'
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
}
