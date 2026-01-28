import { z } from 'zod'

export const ZForgotPassword = z.object({
  email: z.string().email('Invalid email format'),
})

export type TForgotPassword = z.infer<typeof ZForgotPassword>
