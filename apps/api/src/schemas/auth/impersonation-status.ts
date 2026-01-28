import { z } from 'zod'

export const ZImpersonationStatus = z.object({
  isImpersonating: z.boolean(),
  targetUser: z
    .object({
      id: z.string(),
      email: z.string().email(),
      firstname: z.string(),
      lastname: z.string(),
    })
    .optional(),
})

export type TImpersonationStatus = z.infer<typeof ZImpersonationStatus>
