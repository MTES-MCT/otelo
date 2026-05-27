import { Module } from '@nestjs/common'
import { PrismaService } from '../db/prisma.service'
import { DocurbaController } from './docurba.controller'
import { DocurbaService } from './docurba.service'

@Module({
  controllers: [DocurbaController],
  providers: [DocurbaService, PrismaService],
})
export class DocurbaModule {}
