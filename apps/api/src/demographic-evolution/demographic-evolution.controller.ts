import { Controller, Get, Query } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import {
  TEpciCodesQuery,
  TEpciCodesWithMillesimeQuery,
  ZEpciCodesQuery,
  ZEpciCodesWithMillesimeQuery,
} from '~/demographic-evolution/demographic-evolution.dto'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { Role } from '~/generated/prisma/enums'

@Controller('demographic-evolution')
export class DemographicEvolutionController {
  constructor(private readonly demographicEvolutionService: DemographicEvolutionService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/omphale')
  async getDemographicEvolution(@Query({ schema: ZEpciCodesWithMillesimeQuery }) { epciCodes, millesime }: TEpciCodesWithMillesimeQuery) {
    return this.demographicEvolutionService.getDemographicEvolution(epciCodes.join(','), millesime)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/population')
  async getPopulationDemographicEvolution(
    @Query({ schema: ZEpciCodesWithMillesimeQuery }) { epciCodes, millesime }: TEpciCodesWithMillesimeQuery,
  ) {
    return this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(epciCodes.join(','), millesime)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/no-insee-projection')
  async getEpcisWithoutInseeProjection(@Query({ schema: ZEpciCodesQuery }) { epciCodes }: TEpciCodesQuery) {
    return this.demographicEvolutionService.getEpcisWithoutInseeProjection(epciCodes.join(','))
  }
}
