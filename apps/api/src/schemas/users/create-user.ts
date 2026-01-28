import { z } from 'zod'
import { ZUser } from '~/schemas/users/user'

export const ZCreateUser = ZUser.omit({
  createdAt: true,
  id: true,
  role: true,
  updatedAt: true,
})

export type TCreateUser = z.infer<typeof ZCreateUser>
