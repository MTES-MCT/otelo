import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { InvalidRefreshTokenException } from '~/common/exceptions/auth.exceptions'
import { SessionsService } from '~/sessions/sessions.service'

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly sessionsService: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const refreshToken = this.extractTokenFromHeader(request)
    if (!refreshToken) {
      throw new InvalidRefreshTokenException()
    }
    return !!(await this.sessionsService.isValidRefreshToken(refreshToken))
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
