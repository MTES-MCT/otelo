import { z } from 'zod'

export const ZVerifyEmail = z.object({
  code: z.string(),
})

export type TVerifyEmail = z.infer<typeof ZVerifyEmail>
