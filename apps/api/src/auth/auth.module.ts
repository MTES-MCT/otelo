import { Module } from '@nestjs/common'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { UsersModule } from '~/users/users.module'
import { AuthService } from './auth.service'

@Module({
  exports: [AuthService],
  imports: [UsersModule, ScenariosModule, SimulationsModule],
  providers: [AuthService],
})
export class AuthModule {}
