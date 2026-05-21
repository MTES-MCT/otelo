import { Module } from '@nestjs/common'
import { DataPackVersionsModule } from '~/data-pack-versions/data-pack-versions.module'
import { PrismaModule } from '~/db/prisma.module'
import { DemographicEvolutionCustomController } from './demographic-evolution-custom.controller'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

@Module({
  controllers: [DemographicEvolutionCustomController],
  providers: [DemographicEvolutionCustomService],
  imports: [PrismaModule, DataPackVersionsModule],
  exports: [DemographicEvolutionCustomService],
})
export class DemographicEvolutionCustomModule {}
