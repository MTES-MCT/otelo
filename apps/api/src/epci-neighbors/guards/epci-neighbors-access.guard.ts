import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { Role } from '~/generated/prisma/enums'
import { TUser } from '~/schemas/users/user'

interface RequestWithImpersonation extends Request {
  user: TUser
  impersonator?: TUser
}

@Injectable()
export class EpciNeighborsAccessGuard implements CanActivate {
  private readonly allowedEmails: string[]

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('EPCI_NEIGHBORS_ALLOWED_EMAILS') ?? ''
    this.allowedEmails = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithImpersonation>()
    const user = request.user
    const impersonator = request.impersonator

    const effectiveUser = impersonator || user

    if (effectiveUser.role === Role.ADMIN) {
      return true
    }

    return this.allowedEmails.includes(user.email.toLowerCase())
  }
}
