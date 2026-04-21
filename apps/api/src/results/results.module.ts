import { Module } from '@nestjs/common'
import { CoefficientCalculationModule } from '~/calculation/coefficient-calculation/coefficient-calculation.module'
import { NeedsCalculationModule } from '~/calculation/needs-calculation/needs-calculation.module'
import { PrismaModule } from '~/db/prisma.module'
import { PreviewController } from '~/results/preview.controller'
import { PreviewService } from '~/results/preview.service'
import { ResultsController } from '~/results/results.controller'
import { SimulationsModule } from '~/simulations/simulations.module'
import { ResultsService } from './results.service'

@Module({
  controllers: [ResultsController, PreviewController],
  imports: [NeedsCalculationModule, CoefficientCalculationModule, SimulationsModule, PrismaModule],
  providers: [ResultsService, PreviewService],
  exports: [ResultsService, PreviewService],
})
export class ResultsModule {}
