import { z } from 'zod'

export const ZEpciCalculationResult = z.object({
  epciCode: z.string(),
  value: z.number(),
  prorataValue: z.number(),
})
export type TEpciCalculationResult = z.infer<typeof ZEpciCalculationResult>

export const ZCalculationResult = z.object({
  epcis: z.array(ZEpciCalculationResult),
  total: z.number(),
  prorataTotal: z.number(),
})

export type TCalculationResult = z.infer<typeof ZCalculationResult>
