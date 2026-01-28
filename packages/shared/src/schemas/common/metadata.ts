import { z } from 'zod'

export const ZMetadata = z.object({
  max: z.number(),
  min: z.number(),
})

export type TMetadata = z.infer<typeof ZMetadata>
