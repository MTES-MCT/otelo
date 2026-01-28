import { z } from 'zod'

export const ZSignupCallback = z.object({
  email: z.email(),
  firstname: z.string(),
  lastname: z.string(),
  sub: z.string().nullish(),
  id: z.string(),
  provider: z.enum(['proconnect', 'credentials']),
})

export type TSignupCallback = z.infer<typeof ZSignupCallback>
