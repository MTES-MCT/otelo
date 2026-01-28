import { Module } from '@nestjs/common'
import { PrismaModule } from '~/db/prisma.module'
import { UsersService } from '~/users/users.service'
import { UsersController } from './users.controller'

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [PrismaModule],
  providers: [UsersService],
})
export class UsersModule {}
