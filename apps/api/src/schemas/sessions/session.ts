import { ZCommonDateFields } from '@shared'
import { z } from 'zod'

export const ZSession = ZCommonDateFields.extend({
  id: z.string(),
  token: z.string().min(1),
  expiresAt: z.date(),
  userId: z.string().min(1),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  impersonatedBy: z.string().nullable().optional(),
})

export type TSession = z.infer<typeof ZSession>
