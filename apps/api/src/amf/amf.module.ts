import { Module } from '@nestjs/common'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { ConsumersModule } from '~/consumers/consumers.module'
import { DataPackVersionsModule } from '~/data-pack-versions/data-pack-versions.module'
import { PrismaModule } from '~/db/prisma.module'
import { DemographicEvolutionModule } from '~/demographic-evolution/demographic-evolution.module'
import { ExternalModule } from '~/external/external.module'
import { AmfController } from './amf.controller'
import { AmfService } from './amf.service'

@Module({
  imports: [PrismaModule, ConsumersModule, ExternalModule, AccommodationRatesModule, DemographicEvolutionModule, DataPackVersionsModule],
  controllers: [AmfController],
  providers: [AmfService],
})
export class AmfModule {}
