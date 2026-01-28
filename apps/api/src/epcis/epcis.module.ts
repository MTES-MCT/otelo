import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpcisController } from '~/epcis/epcis.controller'
import { EpcisService } from '~/epcis/epcis.service'
@Module({
  controllers: [EpcisController],
  exports: [EpcisService],
  imports: [PrismaModule],
  providers: [EpcisService],
})
export class EpcisModule {}
