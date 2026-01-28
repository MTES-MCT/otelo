import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { VacancyModule } from '~/vacancy/vacancy.module'
import { AccommodationRatesController } from './accommodation-rates.controller'
import { AccommodationRatesService } from './accommodation-rates.service'

@Module({
  controllers: [AccommodationRatesController],
  exports: [AccommodationRatesService],
  imports: [VacancyModule, PrismaModule, EpcisModule],
  providers: [AccommodationRatesService],
})
export class AccommodationRatesModule {}
