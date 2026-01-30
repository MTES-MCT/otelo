import { ZCommonDateFields } from '@shared'
import { z } from 'zod'

export const ZSession = ZCommonDateFields.omit({
  updatedAt: true,
}).extend({
  accessToken: z.string().min(1),
  expiresAt: z.date(),
  id: z.string(),
  refreshToken: z.string().min(1),
  userId: z.string().min(1),
  impersonatedUserId: z.string().nullable().optional(),
})
export type TSession = z.infer<typeof ZSession>
