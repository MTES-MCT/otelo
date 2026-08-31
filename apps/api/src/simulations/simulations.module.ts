import { Module } from '@nestjs/common'
import { AccommodationRatesModule } from '~/accommodation-rates/accommodation-rates.module'
import { PrismaModule } from '~/db/prisma.module'
import { EmailModule } from '~/email/email.module'
import { EpciGroupsModule } from '~/epci-groups/epci-groups.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationChangesService } from './simulation-changes.service'
import { SimulationsController } from './simulations.controller'
import { SimulationsService } from './simulations.service'

@Module({
  controllers: [SimulationsController],
  exports: [SimulationsService, SimulationChangesService],
  imports: [EpcisModule, ScenariosModule, PrismaModule, EmailModule, EpciGroupsModule, AccommodationRatesModule],
  providers: [SimulationsService, SimulationChangesService],
})
export class SimulationsModule {}
