import { Module } from '@nestjs/common'
import { EmailVerificationModule } from '~/common/exceptions/email-verification/email-verification.module'
import { CronModule } from '~/cron/cron.module'
import { PrismaModule } from '~/db/prisma.module'
import { EmailModule } from '~/email/email.module'
import { ScenariosModule } from '~/scenarios/scenarios.module'
import { SessionsModule } from '~/sessions/sessions.module'
import { SimulationsModule } from '~/simulations/simulations.module'
import { UsersModule } from '~/users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ImpersonationService } from './impersonation.service'
import { PasswordResetService } from './password-reset.service'

@Module({
  controllers: [AuthController],
  exports: [AuthService],
  imports: [
    UsersModule,
    SessionsModule,
    ScenariosModule,
    SimulationsModule,
    EmailModule,
    EmailVerificationModule,
    CronModule,
    PrismaModule,
  ],
  providers: [AuthService, PasswordResetService, ImpersonationService],
})
export class AuthModule {}
