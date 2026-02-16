import { Module } from '@nestjs/common'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { UsersModule } from '~/users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  controllers: [AuthController],
  exports: [AuthService],
  imports: [UsersModule, ScenariosModule, SimulationsModule],
  providers: [AuthService],
})
export class AuthModule {}
