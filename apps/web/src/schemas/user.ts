import { SELECTABLE_USER_TYPES, UserType, ZUserBase } from '@shared'
import { z } from 'zod'

export { UserType }

// Extend the base user schema with Web-specific fields
export const ZUser = ZUserBase.extend({
  lastLoginAt: z.date(),
  type: z.enum(Object.values(UserType) as [string, ...string[]]).optional(),
  sub: z.string(),
  engaged: z.boolean(),
  region: z.string().nullable().optional(),
})

export type TUser = z.infer<typeof ZUser>

export const ZSignUp = z
  .object({
    firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type TSignUp = z.infer<typeof ZSignUp>

export const ZUpdateUserType = z.object({
  type: z.enum(SELECTABLE_USER_TYPES),
  userId: z.string(),
})

export type TUpdateUserType = z.infer<typeof ZUpdateUserType>
