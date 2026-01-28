import { Injectable, Logger } from '@nestjs/common'
import * as argon2 from 'argon2'
import { Request } from 'express'
import {
  EmailNotVerifiedException,
  InvalidPasswordException,
  UserHasNoAccessException,
  UserNotFoundException,
} from '~/common/exceptions/auth.exceptions'
import { EmailVerificationService } from '~/common/exceptions/email-verification/email-verification.service'
import { anonymizeEmail } from '~/common/utils/email-anonymizer'
import { CronService } from '~/cron/cron.service'
import { Prisma } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TResetPassword } from '~/schemas/auth/reset-password'
import { TSignIn } from '~/schemas/auth/sign-in'
import { TSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TSignUp } from '~/schemas/auth/sign-up'
import { TSession } from '~/schemas/sessions/session'
import { TUser } from '~/schemas/users/user'
import { SessionsService } from '~/sessions/sessions.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'
import { ImpersonationService } from './impersonation.service'
import { PasswordResetService } from './password-reset.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly simulationsService: SimulationsService,
    private readonly sessionsService: SessionsService,
    private readonly scenariosService: ScenariosService,
    private readonly cronService: CronService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly impersonationService: ImpersonationService,
  ) {}
  private readonly logger = new Logger(AuthService.name)

  async resendConfirmationMail(email: string) {
    return this.emailVerificationService.resendConfirmationMail(email)
  }

  async resendConfirmationCodeEmail(code: string) {
    return this.emailVerificationService.resendConfirmationCodeEmail(code)
  }

  async verifyEmail(code: string) {
    return this.emailVerificationService.verifyEmail(code)
  }

  async validateProConnectSignIn(signInData: TSignupCallback) {
    const { email } = signInData

    let user = await this.usersService.findByEmail(email)

    if (!user) {
      // Check if email is in whitelist to determine hasAccess
      const isInWhitelist = await this.usersService.isEmailInWhitelist(email)

      user = await this.usersService.create({
        email,
        firstname: signInData.firstname,
        provider: 'proconnect',
        sub: signInData.sub ?? null,
        lastname: signInData.lastname,
        lastLoginAt: new Date(),
        emailVerified: new Date(),
        hasAccess: isInWhitelist,
      })
      await this.cronService.handleUserAccessUpdate()
    }
    const session = await this.sessionsService.upsert(user)
    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    })

    return {
      session,
      user,
    }
  }

  async signUp(signUpData: TSignUp) {
    // Check if email is in whitelist to determine hasAccess
    const isInWhitelist = await this.usersService.isEmailInWhitelist(signUpData.email)

    const user = await this.usersService.create({
      email: signUpData.email,
      sub: null,
      firstname: signUpData.firstname,
      lastname: signUpData.lastname,
      emailVerified: null,
      provider: 'credentials',
      lastLoginAt: new Date(),
      password: await this.passwordResetService.hashPassword(signUpData.password),
      hasAccess: isInWhitelist,
    })
    await this.cronService.handleUserAccessUpdate()
    const session = await this.sessionsService.upsert(user)
    await this.emailVerificationService.handleSignUpConfirmation(user)

    return {
      session,
      user,
    }
  }

  async verifyPassword(hash: string | null | undefined, password: string): Promise<boolean> {
    if (!hash) {
      return false
    }

    try {
      return await argon2.verify(hash, password)
    } catch {
      return false
    }
  }

  async signIn(signInData: TSignIn) {
    const user = await this.usersService.findByEmail(signInData.email, { password: true })
    if (!user) {
      throw new UserNotFoundException()
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedException()
    }

    const isPasswordValid = await this.verifyPassword(user.password, signInData.password)
    if (!isPasswordValid) {
      throw new InvalidPasswordException()
    }

    if (!user.hasAccess) {
      throw new UserHasNoAccessException()
    }

    await this.sessionsService.upsert(user)
    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    })
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async refreshToken(refreshToken: string): Promise<{
    session: TSession
    user: TUser
  }> {
    return this.sessionsService.refreshTokens(refreshToken)
  }

  hasRole(user: TUser | undefined, roles: Role[]): boolean {
    const userRole = user?.role
    return roles.some((role) => role === userRole)
  }

  async canAccessEntity(entity: unknown, paramName: string, user: TUser | undefined, request: Request): Promise<boolean> {
    const entityId: string = paramName && (request.params[paramName] as string)
    if (user) {
      switch (entity) {
        case Prisma.ModelName.Scenario:
          return this.scenariosService.hasUserAccessTo(entityId, user.id)
        case Prisma.ModelName.Simulation:
          return this.simulationsService.hasUserAccessTo(entityId, user.id)
        default:
          throw new Error(`Entity not supported in Control Access`)
      }
    }

    return false
  }

  async hasAccess(email: string) {
    return this.usersService.hasUserAccessTo(email)
  }

  async logout(userId: string) {
    const user = await this.usersService.findById(userId)

    if (user?.role === Role.ADMIN) {
      try {
        const impersonationStatus = await this.impersonationService.getImpersonationStatus(userId)
        if (impersonationStatus.isImpersonating) {
          await this.impersonationService.stopImpersonation(userId)
          this.logger.log(`[AUDIT] Admin ${anonymizeEmail(user.email)} (${user.id}) impersonation stopped during logout`)
        }
      } catch (error) {
        this.logger.warn(`Failed to stop impersonation during logout for user ${userId}: ${error}`)
      }
    }

    return this.sessionsService.deleteUserSessions(userId)
  }

  async forgotPassword(email: string) {
    try {
      return this.passwordResetService.generateResetToken(email)
    } catch (error) {
      this.logger.error(error)
    }
  }

  async resetPassword(resetPassword: TResetPassword) {
    const { token, newPassword, confirmPassword } = resetPassword
    return this.passwordResetService.resetPassword(token, newPassword, confirmPassword)
  }

  async checkResetToken(token: string): Promise<void> {
    return this.passwordResetService.checkResetToken(token)
  }
}
