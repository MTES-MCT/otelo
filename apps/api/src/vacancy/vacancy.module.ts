import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { VacancyService } from './vacancy.service'

@Module({
  exports: [VacancyService],
  imports: [PrismaModule, EpcisModule],
  providers: [VacancyService],
})
export class VacancyModule {}
