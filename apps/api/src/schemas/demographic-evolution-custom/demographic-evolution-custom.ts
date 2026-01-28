import { z } from 'zod'

// Get dynamic year range based on current year
const currentYear = new Date().getFullYear()
const minYear = currentYear - 50
const maxYear = currentYear + 100

// Schema for individual year data with enhanced validation
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

// Schema for validating parsed year data array with additional business rules

// Schema for validating CSV row structure
// We expect rows with MENAGES_YYYY columns containing numeric values
const ZCSVRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null(), z.undefined()])).refine(
  (row) => {
    // Check that we have at least one MENAGES column
    const keys = Object.keys(row)
    return keys.some((key) => key.startsWith('MENAGES_') && /MENAGES_\d{4}/.test(key))
  },
  {
    message: 'CSV must contain at least one MENAGES_YYYY column',
  },
)

// Schema for validating the entire CSV data structure
export const ZDemographicEvolutionCustomFile = z.array(ZCSVRowSchema).min(1, {
  message: 'CSV file must contain at least one data row',
})
