import { Controller, Get, Query } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { resolveDateRange } from '~/common/utils/date-range'
import { Role } from '~/generated/prisma/enums'
import { ImpactStatisticsService } from './impact-statistics.service'

@Controller('statistics')
export class ImpactStatisticsController {
  constructor(private readonly impactStatisticsService: ImpactStatisticsService) {}

  /**
   * Usage et impact : comment les scénarios sont paramétrés, pour quels documents
   * d'urbanisme, et ce qu'il en sort (exports, territoires couverts, avis).
   */
  @AccessControl({ roles: [Role.ADMIN] })
  @Get('/impact')
  async getImpactStatistics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.impactStatisticsService.getImpactStatistics(resolveDateRange(from, to))
  }
}
