import { z } from 'zod'

export const ZEpciGroup = z.object({
  id: z.string(),
  name: z.string(),
})

export type TEpciGroup = z.infer<typeof ZEpciGroup>
