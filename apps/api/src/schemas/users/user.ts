import { ZUserBase } from '@shared'
import { z } from 'zod'
import { Role, UserType } from '~/generated/prisma/enums'

// Define the UserType enum values
const UserTypeValues = Object.values(UserType) as [string, ...string[]]

// Extend the base user schema with API-specific fields
export const ZUser = ZUserBase.extend({
  lastLoginAt: z.date(),
  engaged: z.boolean().optional(),
  type: z.enum(UserTypeValues).nullable().optional(),
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
  engaged: true,
  role: true,
})

export type TUserList = z.infer<typeof ZUserList>

// Re-export Role for convenience
export { Role }
