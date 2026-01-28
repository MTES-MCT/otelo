import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExpiredCodeException, InvalidCodeException, UserNotFoundException } from '~/common/exceptions/auth.exceptions'
import { PrismaService } from '~/db/prisma.service'
import { EmailService } from '~/email/email.service'
import { TUser } from '~/schemas/users/user'
import { UsersService } from '~/users/users.service'

@Injectable()
export class EmailVerificationService {
  private readonly CLIENT_BASE_URL

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {
    this.CLIENT_BASE_URL = this.configService.getOrThrow<string>('CLIENT_BASE_URL')
  }
  async resendConfirmationMail(email: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UserNotFoundException()
    }

    return this.handleSignUpConfirmation(user)
  }

  async resendConfirmationCodeEmail(code: string) {
    const emailVerification = await this.prisma.emailVerification.findUnique({
      where: { code },
      include: { user: true },
    })
    if (!emailVerification?.user) {
      throw new UserNotFoundException()
    }

    return this.handleSignUpConfirmation(emailVerification.user)
  }

  async handleSignUpConfirmation(user: TUser) {
    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    })

    const code = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 1)

    await this.prisma.emailVerification.create({
      data: {
        code,
        userId: user.id,
        expiresAt,
      },
    })

    const confirmationUri = `${this.CLIENT_BASE_URL}/verification?code=${code}`
    await this.emailService.sendEmailVerificationEmail(user, confirmationUri)
    return { message: 'Email sent successfully' }
  }

  async verifyEmail(code: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { code },
      include: { user: true },
    })

    if (!verification) {
      throw new InvalidCodeException()
    }

    if (verification.expiresAt < new Date()) {
      throw new ExpiredCodeException()
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: new Date() },
      }),
      this.prisma.emailVerification.deleteMany({
        where: { userId: verification.userId },
      }),
    ])
    return { message: 'success' }
  }
}
