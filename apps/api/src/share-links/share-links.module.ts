import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpcisModule } from '~/epcis/epcis.module'
import { ResultsModule } from '~/results/results.module'
import { ShareLinksController } from './share-links.controller'
import { ShareLinksService } from './share-links.service'

@Module({
  controllers: [ShareLinksController],
  imports: [EpcisModule, PrismaModule, ResultsModule],
  providers: [ShareLinksService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
