import { z } from 'zod'

export const ZSignUp = z.object({
  firstname: z.string(),
  lastname: z.string(),
  email: z.string(),
  password: z.string(),
})

export type TSignUp = z.infer<typeof ZSignUp>
