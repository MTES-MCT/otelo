import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { BadQualityService } from './bad-quality.service'

@Module({
  providers: [BadQualityService],
  exports: [BadQualityService],
  imports: [PrismaModule],
})
export class BadQualityModule {}
