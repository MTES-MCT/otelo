import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { FinancialInadequationService } from './financial-inadequation.service'

@Module({
  providers: [FinancialInadequationService],
  exports: [FinancialInadequationService],
  imports: [PrismaModule],
})
export class FinancialInadequationModule {}
