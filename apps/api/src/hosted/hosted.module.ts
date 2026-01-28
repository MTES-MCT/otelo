import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { HostedService } from '~/hosted/hosted.service'

@Module({
  providers: [HostedService],
  exports: [HostedService],
  imports: [PrismaModule],
})
export class HostedModule {}
