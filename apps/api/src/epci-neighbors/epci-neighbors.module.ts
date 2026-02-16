import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '~/db/prisma.module'
import { EpciNeighborsController } from '~/epci-neighbors/epci-neighbors.controller'
import { EpciNeighborsService } from '~/epci-neighbors/epci-neighbors.service'
import { EpciNeighborsAccessGuard } from '~/epci-neighbors/guards/epci-neighbors-access.guard'

@Module({
  controllers: [EpciNeighborsController],
  exports: [EpciNeighborsService],
  imports: [PrismaModule, ConfigModule],
  providers: [EpciNeighborsService, EpciNeighborsAccessGuard],
})
export class EpciNeighborsModule {}
