import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { SessionsService } from './sessions.service'

@Module({
  exports: [SessionsService],
  imports: [PrismaModule],
  providers: [SessionsService],
})
export class SessionsModule {}
