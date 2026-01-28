import { z } from 'zod'

export const ZCommonDateFields = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type TCommonDateFields = z.infer<typeof ZCommonDateFields>
