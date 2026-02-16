import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { AuthService } from '~/auth/auth.service'
import { TSignupCallback, ZSignupCallback } from '~/schemas/auth/sign-in-callback'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AllowAnonymous()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() signinUserDto: TSignupCallback) {
    const validatedData = ZSignupCallback.parse(signinUserDto)
    return this.authService.validateProConnectSignIn(validatedData)
  }

  @AllowAnonymous()
  @Post('access')
  @HttpCode(HttpStatus.OK)
  async hasUserAccess(@Body() { email }: { email: string }) {
    return this.authService.hasAccess(email)
  }
}
