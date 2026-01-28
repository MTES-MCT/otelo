import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { DemographicEvolutionController } from '~/demographic-evolution/demographic-evolution.controller'
import { DemographicEvolutionService } from './demographic-evolution.service'

@Module({
  controllers: [DemographicEvolutionController],
  exports: [DemographicEvolutionService],
  imports: [PrismaModule],
  providers: [DemographicEvolutionService],
})
export class DemographicEvolutionModule {}
