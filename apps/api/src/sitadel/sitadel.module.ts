import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { SitadelService } from './sitadel.service'

@Module({
  providers: [SitadelService],
  imports: [PrismaModule],
  exports: [SitadelService],
})
export class SitadelModule {}
