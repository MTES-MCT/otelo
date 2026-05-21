import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { ApiConsumer } from '~/generated/prisma/client'

export const Consumer = createParamDecorator((_: unknown, ctx: ExecutionContext): ApiConsumer => {
  const request = ctx.switchToHttp().getRequest()
  return request.apiConsumer
})
