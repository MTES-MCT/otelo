import {
  ZChartData,
  ZChartDataResult,
  ZEpciCalculationResult as ZEpciCalculationResultBase,
  ZFlowRequirementChartData,
  ZFlowRequirementChartDataResult,
  ZSitadelData,
  ZSitadelDataResult,
} from '@shared'
import { z } from 'zod'

export const ZDemographicEvolution = z.object({
  data: z.array(
    z.object({
      value: z.number(),
      year: z.number(),
    }),
  ),
  metadata: z.object({
    data: z.object({
      max: z.number(),
      min: z.number(),
    }),
    period: z.object({
      endYear: z.number(),
      startYear: z.number(),
    }),
  }),
})

export type TDemographicEvolutionOmphale = z.infer<typeof ZDemographicEvolution>

// Re-export shared schemas
export { ZChartData, ZChartDataResult, ZFlowRequirementChartData, ZFlowRequirementChartDataResult, ZSitadelData, ZSitadelDataResult }
export type {
  TChartData,
  TChartDataResult,
  TFlowRequirementChartData,
  TFlowRequirementChartDataResult,
  TSitadelData,
  TSitadelDataResult,
} from '@shared'

// Web version of ZEpciCalculationResult (same as shared)
export const ZEpciCalculationResult = ZEpciCalculationResultBase
export type TEpciCalculationResult = z.infer<typeof ZEpciCalculationResult>

export const ZEpciTotalCalculationResult = z.object({
  epciCode: z.string(),
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  prepeakTotalStock: z.number(),
  postpeakTotalStock: z.number(),
})
export type TEpciTotalCalculationResult = z.infer<typeof ZEpciTotalCalculationResult>

// Web version of ZCalculationResult (slightly different - missing prorataTotal)
export const ZCalculationResult = z.object({
  epcis: z.array(ZEpciCalculationResult),
  total: z.number(),
})

export type TCalculationResult = z.infer<typeof ZCalculationResult>

export const ZResults = z.object({
  badQuality: ZCalculationResult,
  epcisTotals: z.array(z.object({ epciCode: z.string(), total: z.number(), totalFlux: z.number(), totalStock: z.number() })),
  financialInadequation: ZCalculationResult,
  hosted: ZCalculationResult,
  noAccomodation: ZCalculationResult,
  physicalInadequation: ZCalculationResult,
  flowRequirement: ZFlowRequirementChartDataResult,
  sitadel: ZSitadelDataResult,
  socialParc: ZCalculationResult,
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodation: z.number(),
  secondaryAccommodation: z.number(),
})

export type TResults = z.infer<typeof ZResults>
