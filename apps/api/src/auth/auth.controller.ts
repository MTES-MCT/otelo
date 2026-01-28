import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from '~/auth/auth.service'
import { ImpersonationService } from '~/auth/impersonation.service'
import { User } from '~/common/decorators/authenticated-user'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Public } from '~/common/decorators/public.decorator'
import { UsurpationUser } from '~/common/decorators/usurpation-user'
import { RefreshTokenGuard } from '~/common/guards/refreshtoken.guard'
import { Role } from '~/generated/prisma/enums'
import { TForgotPassword } from '~/schemas/auth/forgot-password'
import { TResetPassword } from '~/schemas/auth/reset-password'
import { TSignIn } from '~/schemas/auth/sign-in'
import { TSignupCallback, ZSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TSignUp } from '~/schemas/auth/sign-up'
import { TUser } from '~/schemas/users/user'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly impersonationService: ImpersonationService,
  ) {}

  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() signinUserDto: TSignupCallback) {
    const validatedData = ZSignupCallback.parse(signinUserDto)
    return this.authService.validateProConnectSignIn(validatedData)
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() signupUserDto: TSignUp) {
    return this.authService.signUp(signupUserDto)
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signinUserDto: TSignIn) {
    return this.authService.signIn(signinUserDto)
  }

  @Public()
  @Post('access')
  @HttpCode(HttpStatus.OK)
  async hasUserAccess(@Body() { email }: { email: string }) {
    return this.authService.hasAccess(email)
  }

  @Public()
  @Post('confirmation-mail')
  @HttpCode(HttpStatus.OK)
  async resendConfirmationMail(@Body() { email }: { email: string }) {
    return this.authService.resendConfirmationMail(email)
  }

  @Public()
  @Post('confirmation-code-mail')
  @HttpCode(HttpStatus.OK)
  async resendConfirmationCodeEmail(@Body() { code }: { code: string }) {
    return this.authService.resendConfirmationCodeEmail(code)
  }

  @Public()
  @Post('verify-mail')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() { code }: { code: string }) {
    return this.authService.verifyEmail(code)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() request: Request) {
    const [_, token] = request.headers.authorization?.split(' ') ?? []
    const refreshedUserSession = await this.authService.refreshToken(token)
    request['user'] = refreshedUserSession.user as TUser
    return refreshedUserSession
  }

  @Get('logout')
  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @HttpCode(HttpStatus.OK)
  async logout(@UsurpationUser() { id: userId }: TUser) {
    return this.authService.logout(userId)
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: TForgotPassword) {
    return this.authService.forgotPassword(forgotPasswordDto.email)
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: TResetPassword) {
    return this.authService.resetPassword(resetPasswordDto)
  }

  @Public()
  @Post('check-reset-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async checkResetToken(@Body() { token }: { token: string }) {
    await this.authService.checkResetToken(token)
  }

  @Post('impersonate/:userId')
  @HttpCode(HttpStatus.OK)
  @AccessControl({ roles: [Role.ADMIN] })
  async startImpersonation(@User() admin: TUser, @Param('userId') targetUserId: string) {
    await this.impersonationService.startImpersonation(admin.id, targetUserId)
  }

  @Delete('impersonate')
  @HttpCode(HttpStatus.OK)
  @AccessControl({ roles: [Role.ADMIN] })
  async stopImpersonation(@UsurpationUser() admin: TUser) {
    await this.impersonationService.stopImpersonation(admin.id)
  }

  @Get('impersonation-status')
  @HttpCode(HttpStatus.OK)
  @AccessControl({ roles: [Role.ADMIN] })
  async getImpersonationStatus(@UsurpationUser() admin: TUser) {
    return this.impersonationService.getImpersonationStatus(admin.id)
  }
}
