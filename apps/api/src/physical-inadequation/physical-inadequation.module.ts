import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { PhysicalInadequationService } from './physical-inadequation.service'

@Module({
  providers: [PhysicalInadequationService],
  exports: [PhysicalInadequationService],
  imports: [PrismaModule],
})
export class PhysicalInadequationModule {}
