import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { TUser } from '~/schemas/users/user'

export const UsurpationUser = createParamDecorator((_: unknown, ctx: ExecutionContext): TUser => {
  const request = ctx.switchToHttp().getRequest()
  return request.impersonator || request.user
})
