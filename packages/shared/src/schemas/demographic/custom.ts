import { z } from 'zod'
import { ZOmphaleYearData } from './evolution.base'

export const ZCreateDemographicEvolutionCustomDto = z.object({
  epciCode: z.string(),
  scenarioId: z.string().uuid().optional(),
  data: z.array(ZOmphaleYearData).min(1),
})

export type TCreateDemographicEvolutionCustomDto = z.infer<typeof ZCreateDemographicEvolutionCustomDto>

// Schema for validating CSV row structure
const ZCSVRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null(), z.undefined()])).refine(
  (row) => {
    const keys = Object.keys(row)
    return keys.some((key) => key.startsWith('MENAGES_') && /MENAGES_\d{4}/.test(key))
  },
  {
    message: 'CSV must contain at least one MENAGES_YYYY column',
  },
)

export const ZDemographicEvolutionCustomFile = z.array(ZCSVRowSchema).min(1, {
  message: 'CSV file must contain at least one data row',
})

export type TDemographicEvolutionCustomFile = z.infer<typeof ZDemographicEvolutionCustomFile>
