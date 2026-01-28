import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { NoAccommodationService } from './no-accommodation.service'

@Module({
  providers: [NoAccommodationService],
  exports: [NoAccommodationService],
  imports: [PrismaModule],
})
export class NoAccommodationModule {}
