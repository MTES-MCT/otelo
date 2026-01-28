import { Module } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { EmailModule } from '~/email/email.module'
import { UsersModule } from '~/users/users.module'
import { EmailVerificationService } from './email-verification.service'

@Module({
  providers: [EmailVerificationService, PrismaService],
  exports: [EmailVerificationService],
  imports: [UsersModule, EmailModule],
})
export class EmailVerificationModule {}
