import z from 'zod'

const ZHouseholdSizesDataItem = z.object({
  year: z.number(),
  centralB: z.number().optional(),
  centralC: z.number().optional(),
  centralH: z.number().optional(),
  phB: z.number().optional(),
  phC: z.number().optional(),
  phH: z.number().optional(),
  pbB: z.number().optional(),
  pbC: z.number().optional(),
  pbH: z.number().optional(),
})

export type THouseholdSizesDataItem = z.infer<typeof ZHouseholdSizesDataItem>

export const ZHouseholdSizesDataResults = z.object({
  data: z.array(ZHouseholdSizesDataItem),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: z.object({
    max: z.number(),
    min: z.number(),
  }),
})

export type THouseholdSizesDataResults = z.infer<typeof ZHouseholdSizesDataResults>

export const ZHouseholdSizesChart = z.object({
  linearChart: z.record(z.string(), ZHouseholdSizesDataResults),
})

export type THouseholdSizesChart = z.infer<typeof ZHouseholdSizesChart>
