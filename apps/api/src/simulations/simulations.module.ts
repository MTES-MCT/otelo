import { Module } from '@nestjs/common'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { PrismaModule } from '~/db/prisma.module'
import { EmailModule } from '~/email/email.module'
import { EpciGroupsModule } from '~/epci-groups/epci-groups.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationEventsModule } from './simulation-events/simulation-events.module'
import { SimulationsController } from './simulations.controller'
import { SimulationsService } from './simulations.service'

@Module({
  controllers: [SimulationsController],
  exports: [SimulationsService],
  imports: [EpcisModule, ScenariosModule, PrismaModule, EmailModule, EpciGroupsModule, AccommodationRatesModule, SimulationEventsModule],
  providers: [SimulationsService],
})
export class SimulationsModule {}
