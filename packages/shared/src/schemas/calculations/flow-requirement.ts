import { z } from 'zod'

export const ZFlowRequirementChartData = z.object({
  code: z.string(),
  data: z.object({
    parcEvolution: z.record(z.string(), z.number()),
    housingNeeds: z.record(z.string(), z.number()),
    surplusHousing: z.record(z.string(), z.number()),
    peakYear: z.number(),
  }),
  totals: z.object({
    demographicEvolution: z.number(),
    renewalNeeds: z.number(),
    secondaryResidenceAccomodationEvolution: z.number(),
    surplusHousing: z.number(),
    housingNeeds: z.number(),
    vacantAccomodation: z.number(),
    shortTermVacantAccomodation: z.number(),
    longTermVacantAccomodation: z.number(),
  }),
  metadata: z.object({ max: z.number(), min: z.number() }),
})
export type TFlowRequirementChartData = z.infer<typeof ZFlowRequirementChartData>

export const ZFlowRequirementChartDataResult = z.object({
  epcis: z.array(ZFlowRequirementChartData),
})
export type TFlowRequirementChartDataResult = z.infer<typeof ZFlowRequirementChartDataResult>
