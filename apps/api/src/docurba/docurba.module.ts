import { Module } from '@nestjs/common'
import { DocurbaController } from './docurba.controller'
import { DocurbaService } from './docurba.service'

@Module({
  controllers: [DocurbaController],
  providers: [DocurbaService],
})
export class DocurbaModule {}
