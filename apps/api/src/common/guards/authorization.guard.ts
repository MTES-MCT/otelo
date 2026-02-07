import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { fromNodeHeaders } from 'better-auth/node'
import { Request } from 'express'
import { AuthService } from '~/auth/auth.service'
import { auth } from '~/auth/better-auth'
import { ACCESS_CONTROL_KEY, TModelAccess } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })
    const user = session?.user
    const modelAccess = this.reflector.getAllAndOverride<TModelAccess>(ACCESS_CONTROL_KEY, [context.getHandler(), context.getClass()])

    if (!user) {
      if (!modelAccess) {
        return true
      }
      return false
    }

    const isImpersonating = session?.session?.impersonatedBy

    if (isImpersonating || user.role === Role.ADMIN) {
      return true
    }

    if (!user.hasAccess) {
      return false
    }

    if (!modelAccess) {
      return true
    }

    if (!this.authService.hasRole(user as unknown as TUser, modelAccess.roles)) {
      return false
    }

    if (modelAccess.entity) {
      return this.authService.canAccessEntity(modelAccess.entity, modelAccess.paramName || '', user as unknown as TUser, request)
    }

    return true
  }
}
