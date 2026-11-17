import { z } from 'zod'

export const ZCreateConsumer = z.object({
  name: z.string().min(1).max(100),
})

export const ZUpdateConsumer = z.object({
  name: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
})
export type TCreateConsumer = z.output<typeof ZCreateConsumer>
export type TUpdateConsumer = z.output<typeof ZUpdateConsumer>
