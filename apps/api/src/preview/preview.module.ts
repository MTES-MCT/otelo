import { Module } from '@nestjs/common'
import { NeedsCalculationModule } from '~/calculation/needs-calculation/needs-calculation.module'
import { PrismaModule } from '~/db/prisma.module'
import { PreviewController } from '~/preview/preview.controller'
import { PreviewService } from '~/preview/preview.service'
import { SimulationsModule } from '~/simulations/simulations.module'

@Module({
  controllers: [PreviewController],
  imports: [NeedsCalculationModule, SimulationsModule, PrismaModule],
  providers: [PreviewService],
  exports: [PreviewService],
})
export class PreviewModule {}
