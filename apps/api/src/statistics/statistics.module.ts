import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { AudienceStatisticsService } from './audience-statistics.service'
import { ImpactStatisticsController } from './impact-statistics.controller'
import { ImpactStatisticsService } from './impact-statistics.service'
import { PublicStatisticsController } from './public-statistics.controller'
import { PublicStatisticsService } from './public-statistics.service'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { StatisticsExportsController } from './statistics-exports.controller'
import { StatisticsExportsService } from './statistics-exports.service'

@Module({
  imports: [PrismaModule],
  controllers: [PublicStatisticsController, StatisticsExportsController, ImpactStatisticsController, StatisticsController],
  providers: [StatisticsService, AudienceStatisticsService, ImpactStatisticsService, PublicStatisticsService, StatisticsExportsService],
  exports: [StatisticsService, AudienceStatisticsService, StatisticsExportsService],
})
export class StatisticsModule {}
