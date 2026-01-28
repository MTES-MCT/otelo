import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { FilocomService } from './filocom.service'

@Module({
  providers: [FilocomService],
  exports: [FilocomService],
  imports: [PrismaModule],
})
export class FilocomModule {}
