import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { BassinService } from './bassin.service'

@Module({
  exports: [BassinService],
  providers: [BassinService, PrismaService],
})
export class BassinModule {}
