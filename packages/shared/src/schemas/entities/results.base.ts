import { z } from 'zod'
import { ZCalculationResult } from '../calculations/calculation-result'
import { ZFlowRequirementChartDataResult } from '../calculations/flow-requirement'
import { ZSitadelDataResult } from '../calculations/sitadel'

export const ZStockRequirementsResults = z.object({
  badQuality: ZCalculationResult,
  financialInadequation: ZCalculationResult,
  hosted: ZCalculationResult,
  physicalInadequation: ZCalculationResult,
  noAccomodation: ZCalculationResult,
})

export type TStockRequirementsResults = z.infer<typeof ZStockRequirementsResults>

export const ZResultsBase = ZStockRequirementsResults.extend({
  epcisTotals: z.array(
    z.object({
      epciCode: z.string(),
      total: z.number(),
      totalFlux: z.number(),
      totalStock: z.number(),
      vacantAccomodation: z.number(),
      prepeakTotalStock: z.number(),
      postpeakTotalStock: z.number(),
      secondaryAccommodation: z.number(),
    }),
  ),
  flowRequirement: ZFlowRequirementChartDataResult,
  sitadel: ZSitadelDataResult,
  total: z.number(),
  totalFlux: z.number(),
  totalStock: z.number(),
  vacantAccomodation: z.number(),
  secondaryAccommodation: z.number(),
  name: z.string().optional(),
})

export type TResultsBase = z.infer<typeof ZResultsBase>
