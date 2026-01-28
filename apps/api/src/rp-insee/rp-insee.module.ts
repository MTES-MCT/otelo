import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { RpInseeService } from './rp-insee.service'

@Module({
  exports: [RpInseeService],
  imports: [PrismaModule],
  providers: [RpInseeService],
})
export class RpInseeModule {}
