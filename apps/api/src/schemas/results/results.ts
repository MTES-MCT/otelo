import { z } from 'zod'
import { ZResultsBase, ZStockRequirementsResults as ZStockRequirementsResultsBase } from '@shared'

export const ZStockRequirementsResults = ZStockRequirementsResultsBase
export type TStockRequirementsResults = z.infer<typeof ZStockRequirementsResultsBase>

export const ZResults = ZResultsBase
export type TResults = z.infer<typeof ZResultsBase>
