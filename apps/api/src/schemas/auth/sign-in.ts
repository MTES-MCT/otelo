import { z } from 'zod'

export const ZSignIn = z.object({
  email: z.string(),
  password: z.string(),
})

export type TSignIn = z.infer<typeof ZSignIn>
