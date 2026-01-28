import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { ScenariosController } from './scenarios.controller'
import { ScenariosService } from './scenarios.service'

@Module({
  controllers: [ScenariosController],
  exports: [ScenariosService],
  imports: [PrismaModule],
  providers: [ScenariosService],
})
export class ScenariosModule {}
