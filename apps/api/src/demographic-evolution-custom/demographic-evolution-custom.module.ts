import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { DemographicEvolutionCustomController } from './demographic-evolution-custom.controller'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

@Module({
  controllers: [DemographicEvolutionCustomController],
  providers: [DemographicEvolutionCustomService],
  imports: [PrismaModule],
  exports: [DemographicEvolutionCustomService],
})
export class DemographicEvolutionCustomModule {}
