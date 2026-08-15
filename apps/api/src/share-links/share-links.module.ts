import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { ResultsModule } from '~/results/results.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { ShareLinksController } from './share-links.controller'
import { ShareLinksService } from './share-links.service'

@Module({
  controllers: [ShareLinksController],
  imports: [PrismaModule, ResultsModule, SimulationsModule],
  providers: [ShareLinksService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
