import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpciNeighborsController } from '~/epci-neighbors/epci-neighbors.controller'
import { EpciNeighborsService } from '~/epci-neighbors/epci-neighbors.service'

@Module({
  controllers: [EpciNeighborsController],
  exports: [EpciNeighborsService],
  imports: [PrismaModule],
  providers: [EpciNeighborsService],
})
export class EpciNeighborsModule {}
