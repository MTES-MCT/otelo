import { Module } from '@nestjs/common'
import { NeedsCalculationModule } from '~/calculation/needs-calculation/needs-calculation.module'
import { ConsumersModule } from '~/consumers/consumers.module'
import { PrismaModule } from '~/db/prisma.module'
import { ResultsModule } from '~/results/results.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { ExternalController } from './external.controller'
import { ExternalService } from './external.service'

@Module({
  imports: [PrismaModule, ConsumersModule, SimulationsModule, ResultsModule, NeedsCalculationModule],
  controllers: [ExternalController],
  providers: [ExternalService],
})
export class ExternalModule {}
