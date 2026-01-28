import { z } from 'zod'

// Get dynamic year range based on current year
const currentYear = new Date().getFullYear()
const minYear = currentYear - 50
const maxYear = currentYear + 100

export const ZOmphaleYearData = z.object({
  year: z
    .number()
    .int()
    .min(minYear, { message: `Year must be at least ${minYear}` })
    .max(maxYear, { message: `Year must be at most ${maxYear}` }),
  value: z
    .number()
    .nonnegative({ message: 'Population values must be non-negative' })
    .max(10_000_000, { message: 'Population value exceeds reasonable limit of 10 million' }),
})

export type TOmphaleYearData = z.infer<typeof ZOmphaleYearData>

export const ZDemographicEvolutionOmphaleCustomBase = z.object({
  id: z.string().uuid(),
  data: z.array(ZOmphaleYearData),
  userId: z.string().uuid(),
  epciCode: z.string(),
  scenarioId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type TDemographicEvolutionOmphaleCustomBase = z.infer<typeof ZDemographicEvolutionOmphaleCustomBase>
