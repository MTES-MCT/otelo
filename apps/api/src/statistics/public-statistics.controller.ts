import { Controller, Get, Header } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ExcludeOpenApi } from '~/common/decorators/exclude-open-api.decorator'
import { PublicStatisticsService } from './public-statistics.service'

@ExcludeOpenApi()
@Controller('statistics')
export class PublicStatisticsController {
  constructor(private readonly publicStatisticsService: PublicStatisticsService) {}

  /**
   * Chiffres d'usage agrégés, ouverts à tous : aucune donnée utilisateur ni chiffre de besoins.
   */
  @AllowAnonymous()
  @Get('/public')
  @Header('Cache-Control', 'public, max-age=3600')
  async getPublicStatistics() {
    return this.publicStatisticsService.getPublicStatistics()
  }
}
