import { forwardRef, Module } from '@nestjs/common'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { PrismaModule } from '~/db/prisma.module'
import { DemographicEvolutionModule } from '~/demographic-evolution/demographic-evolution.module'
import { ResultsModule } from '~/results/results.module'
import { ExportExcelController } from './export-excel.controller'
import { ExportExcelService } from './export-excel.service'

@Module({
  providers: [ExportExcelService],
  exports: [ExportExcelService],
  imports: [PrismaModule, forwardRef(() => ResultsModule), AccommodationRatesModule, DemographicEvolutionModule],
  controllers: [ExportExcelController],
})
export class ExportExcelModule {}
