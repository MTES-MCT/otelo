import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'

@Module({
  exports: [PrismaService],
  providers: [PrismaService],
})
export class PrismaModule {}
