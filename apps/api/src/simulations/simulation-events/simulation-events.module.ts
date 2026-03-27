import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { SimulationEventsController } from './simulation-events.controller'
import { SimulationEventsService } from './simulation-events.service'

@Module({
  imports: [PrismaModule],
  controllers: [SimulationEventsController],
  providers: [SimulationEventsService],
  exports: [SimulationEventsService],
})
export class SimulationEventsModule {}
