import { z } from 'zod'

export const ZUpdateUserAccess = z.object({
  hasAccess: z.boolean(),
})

export const ZUpdateUserRegion = z.object({
  region: z.string().max(2).nullable(),
})
export type TUpdateUserAccess = z.output<typeof ZUpdateUserAccess>
export type TUpdateUserRegion = z.output<typeof ZUpdateUserRegion>
