import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { EpciGroupsController } from './epci-groups.controller'
import { EpciGroupsService } from './epci-groups.service'

@Module({
  imports: [PrismaModule],
  controllers: [EpciGroupsController],
  providers: [EpciGroupsService],
  exports: [EpciGroupsService],
})
export class EpciGroupsModule {}
