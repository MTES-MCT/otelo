import { Controller, Get, Query } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { Role } from '~/generated/prisma/enums'
import { EpciCodesQueryDto, EpciCodesWithMillesimeQueryDto } from './demographic-evolution.dto'

@Controller('demographic-evolution')
export class DemographicEvolutionController {
  constructor(private readonly demographicEvolutionService: DemographicEvolutionService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/omphale')
  async getDemographicEvolution(@Query() { epciCodes, millesime }: EpciCodesWithMillesimeQueryDto) {
    return this.demographicEvolutionService.getDemographicEvolution(epciCodes.join(','), millesime)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/population')
  async getPopulationDemographicEvolution(@Query() { epciCodes, millesime }: EpciCodesWithMillesimeQueryDto) {
    return this.demographicEvolutionService.getDemographicEvolutionPopulationByEpci(epciCodes.join(','), millesime)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('/no-insee-projection')
  async getEpcisWithoutInseeProjection(@Query() { epciCodes }: EpciCodesQueryDto) {
    return this.demographicEvolutionService.getEpcisWithoutInseeProjection(epciCodes.join(','))
  }
}
