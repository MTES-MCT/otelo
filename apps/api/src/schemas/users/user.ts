import { ZUserBase } from '@shared'
import { z } from 'zod'
import { Role } from '~/generated/prisma/enums'

// Extend the base user schema with API-specific fields
export const ZUser = ZUserBase.extend({
  lastLoginAt: z.date(),
  emailVerified: z.date().nullable(),
  provider: z.string().nullable(),
  sub: z.string().nullable(),
  password: z.string().nullish(),
  engaged: z.boolean().optional(),
})

export type TUser = z.infer<typeof ZUser>

export const ZUserList = ZUser.pick({
  createdAt: true,
  email: true,
  firstname: true,
  id: true,
  lastLoginAt: true,
  lastname: true,
  hasAccess: true,
})

export type TUserList = z.infer<typeof ZUserList>

// Re-export Role for convenience
export { Role }
