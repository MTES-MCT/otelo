import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { IS_PUBLIC_KEY } from '~/common/decorators/public.decorator'
import { TUser } from '~/schemas/users/user'
import { SessionsService } from '~/sessions/sessions.service'
import { UsersService } from '~/users/users.service'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) {
      return Promise.resolve(true)
    }
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) {
      return Promise.resolve(false)
    }

    const session = await this.sessionsService.isValidToken(token)
    if (session) {
      const authenticatedUser = await this.usersService.getByToken(session.accessToken)

      if (session.impersonatedUserId) {
        const isValidImpersonation = await this.sessionsService.validateActiveImpersonation(
          authenticatedUser.id,
          session.impersonatedUserId,
        )

        if (isValidImpersonation) {
          const impersonatedUser = await this.usersService.findById(session.impersonatedUserId)
          if (impersonatedUser) {
            request['user'] = impersonatedUser as TUser
            request['impersonator'] = authenticatedUser as TUser
            return Promise.resolve(true)
          }
        } else {
          await this.sessionsService.cleanInvalidImpersonationSession(session.id)
          return Promise.resolve(false)
        }
      }

      request['user'] = authenticatedUser as TUser
      return Promise.resolve(true)
    }

    return Promise.resolve(false)
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
