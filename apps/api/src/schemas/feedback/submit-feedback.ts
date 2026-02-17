import { z } from 'zod'

export const ZSubmitFeedback = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

export type TSubmitFeedback = z.infer<typeof ZSubmitFeedback>
