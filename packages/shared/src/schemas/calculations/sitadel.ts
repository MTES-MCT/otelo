import { z } from 'zod'

export const ZSitadelData = z.object({
  code: z.string(),
  data: z.array(
    z.object({
      authorizedHousingCount: z.number(),
      startedHousingCount: z.number(),
      year: z.number(),
    }),
  ),
  metadata: z.object({ max: z.number(), min: z.number() }),
})
export type TSitadelData = z.infer<typeof ZSitadelData>

export const ZSitadelDataResult = z.object({
  epcis: z.array(ZSitadelData),
})
export type TSitadelDataResult = z.infer<typeof ZSitadelDataResult>
