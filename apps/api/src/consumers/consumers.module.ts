import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { ConsumersController } from './consumers.controller'
import { ConsumersService } from './consumers.service'

@Module({
  imports: [PrismaModule],
  controllers: [ConsumersController],
  providers: [ConsumersService],
  exports: [ConsumersService],
})
export class ConsumersModule {}
