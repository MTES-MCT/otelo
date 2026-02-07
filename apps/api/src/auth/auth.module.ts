import { Module } from '@nestjs/common'
import { CronModule } from '~/cron/cron.module'
import { PrismaModule } from '~/db/prisma.module'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { UsersModule } from '~/users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  controllers: [AuthController],
  exports: [AuthService],
  imports: [UsersModule, ScenariosModule, SimulationsModule, CronModule, PrismaModule],
  providers: [AuthService],
})
export class AuthModule {}
