import { z } from 'zod'

// Schema for individual year data
export const ZOmphaleYearData = z.object({
  year: z.number().int().min(2000).max(2100),
  value: z.number(),
})

// Schema for creating DemographicEvolutionOmphaleCustom
export const ZCreateDemographicEvolutionCustomDto = z.object({
  epciCode: z.string(),
  scenarioId: z.string().uuid().optional(),
  data: z.array(ZOmphaleYearData).min(1),
})

export type TCreateDemographicEvolutionCustomDto = z.infer<typeof ZCreateDemographicEvolutionCustomDto>

// Schema for the complete DemographicEvolutionOmphaleCustom entity
export const ZDemographicEvolutionOmphaleCustom = z.object({
  id: z.string().uuid(),
  data: z.array(ZOmphaleYearData),
  userId: z.string().uuid(),
  epciCode: z.string(),
  scenarioId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type TDemographicEvolutionOmphaleCustom = z.infer<typeof ZDemographicEvolutionOmphaleCustom>
