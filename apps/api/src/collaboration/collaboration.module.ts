import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { SimulationEventsModule } from '~/simulations/simulation-events/simulation-events.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { UsersModule } from '~/users/users.module'
import { CollaborationController } from './collaboration.controller'
import { CollaborationService } from './collaboration.service'

@Module({
  controllers: [CollaborationController],
  exports: [CollaborationService],
  imports: [PrismaModule, UsersModule, SimulationsModule, SimulationEventsModule],
  providers: [CollaborationService],
})
export class CollaborationModule {}
