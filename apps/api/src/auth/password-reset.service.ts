import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as argon2 from 'argon2'
import { randomUUID } from 'crypto'
import { PrismaService } from '~/db/prisma.service'
import { EmailService } from '~/email/email.service'

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async generateResetToken(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return new BadRequestException('User does not exist.')
    }

    if (user.provider !== 'credentials' || !user.password) {
      throw new BadRequestException('Password reset is only available for accounts created with email and password.')
    }

    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiration

    await this.prisma.userAccountResetToken.deleteMany({
      where: { userId: user.id },
    })

    await this.prisma.userAccountResetToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    })

    const resetUrl = `${this.configService.get('CLIENT_BASE_URL')}/modification-mot-de-passe?token=${token}`

    await this.sendPasswordResetEmail(user.email, resetUrl)
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match.')
    }

    const resetToken = await this.prisma.userAccountResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      throw new NotFoundException('Invalid or expired reset token.')
    }

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.userAccountResetToken.delete({
        where: { token },
      })
      throw new BadRequestException('Reset token has expired.')
    }

    const hashedPassword = await this.hashPassword(newPassword)

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    await this.prisma.userAccountResetToken.delete({
      where: { token },
    })
  }

  async checkResetToken(token: string): Promise<void> {
    const resetToken = await this.prisma.userAccountResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      throw new NotFoundException('Reset token not found.')
    }

    if (resetToken.expiresAt < new Date()) {
      throw new ForbiddenException('Reset token has expired.')
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })
  }

  private async sendPasswordResetEmail(email: string, resetUrl: string) {
    const templateId = this.configService.get('BREVO_PASSWORD_RESET_TEMPLATE_ID')

    await this.emailService.sendTemplatedEmail(
      templateId,
      {
        resetUrl,
      },
      email,
      'Réinitialisation de votre mot de passe Otelo',
    )
  }
}
