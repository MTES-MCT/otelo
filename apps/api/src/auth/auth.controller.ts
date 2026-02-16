import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { AuthService } from '~/auth/auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @AllowAnonymous()
  @Post('access')
  @HttpCode(HttpStatus.OK)
  async hasUserAccess(@Body() { email }: { email: string }) {
    return this.authService.hasAccess(email)
  }
}
