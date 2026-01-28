import { Module } from '@nestjs/common'
import { AdminController } from '~/admin/admin.controller'
import { UsersModule } from '~/users/users.module'
import { AdminService } from './admin.service'

@Module({
  imports: [UsersModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
