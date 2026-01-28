import { z } from 'zod'

export const ZBassin = z.object({
  name: z.string(),
})

export type TBassin = z.infer<typeof ZBassin>
