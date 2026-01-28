import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { HouseholdSizesService } from './household-sizes.service'

@Module({
  providers: [HouseholdSizesService],
  imports: [PrismaModule],
  exports: [HouseholdSizesService],
})
export class HouseholdSizesModule {}
