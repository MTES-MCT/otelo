import { z } from 'zod'

export const ZResetPassword = z
  .object({
    token: z.string().uuid('Invalid token format'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type TResetPassword = z.infer<typeof ZResetPassword>
