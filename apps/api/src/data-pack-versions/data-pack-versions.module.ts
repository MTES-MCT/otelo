import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { DataPackVersionsController } from './data-pack-versions.controller'
import { DataPackVersionsService } from './data-pack-versions.service'

@Module({
  controllers: [DataPackVersionsController],
  exports: [DataPackVersionsService],
  imports: [PrismaModule],
  providers: [DataPackVersionsService],
})
export class DataPackVersionsModule {}
