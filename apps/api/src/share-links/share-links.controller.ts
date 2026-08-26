import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { RequestWithShareSimulationId, ShareTokenGuard } from '~/common/guards/share-token.guard'
import { Prisma, Role } from '~/generated/prisma/client'
import { ShareLinksService } from './share-links.service'

@Controller()
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'simulationId',
    roles: [Role.USER, Role.ADMIN],
  })
  @Get('simulations/:simulationId/share')
  @HttpCode(HttpStatus.OK)
  async getShareStatus(@Param('simulationId') simulationId: string) {
    return this.shareLinksService.getShareStatus(simulationId)
  }

  @AccessControl({
    entity: Prisma.ModelName.Simulation,
    paramName: 'simulationId',
    roles: [Role.USER, Role.ADMIN],
  })
  @Post('simulations/:simulationId/share/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleShare(@Param('simulationId') simulationId: string) {
    return this.shareLinksService.toggleShare(simulationId)
  }

  @AllowAnonymous()
  @UseGuards(ShareTokenGuard)
  @Get('share/:token')
  @HttpCode(HttpStatus.OK)
  async getSharedResults(@Req() req: RequestWithShareSimulationId) {
    return this.shareLinksService.getResultsByToken(req.shareSimulationId)
  }

  /**
   * Contours des EPCI de la simulation partagée, pour la carte. Passe par le token de partage
   * plutôt que par `/epcis/contours`, qui demande une session.
   */
  @AllowAnonymous()
  @UseGuards(ShareTokenGuard)
  @Get('share/:token/contours')
  @HttpCode(HttpStatus.OK)
  async getSharedContours(@Req() req: RequestWithShareSimulationId) {
    return this.shareLinksService.getContoursByToken(req.shareSimulationId)
  }
}
