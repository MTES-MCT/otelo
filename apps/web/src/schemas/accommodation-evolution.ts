import { z } from 'zod'
import { ZMetadata } from '~/schemas/demographic-evolution'

const ZAccommodationEvolutionData = z.object({
  data: z.array(
    z.object({
      year: z.number(),
      vacant: z.number().optional(),
      secondaryAccommodations: z.number().optional(),
    }),
  ),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: ZMetadata,
})

const ZAccommodationEvolutionDataTableRow = z.object({
  '2010': z.object({
    value: z.number(),
    percent: z.string(),
  }),
  '2015': z.object({
    value: z.number(),
    percent: z.string(),
  }),
  '2021': z.object({
    value: z.number(),
    percent: z.string(),
  }),
  annualEvolution: z.record(
    z.string(),
    z.object({
      percent: z.string(),
      value: z.number(),
      percentPoint: z.string(),
    }),
  ),
  name: z.string(),
})

export const ZAccommodationEvolutionDataTable = z.record(z.string(), ZAccommodationEvolutionDataTableRow)
export type TAccommodationEvolutionDataTable = z.infer<typeof ZAccommodationEvolutionDataTable>

export const ZAccommodationEvolution = z.object({
  linearChart: z.record(z.string(), ZAccommodationEvolutionData),
  tableData: ZAccommodationEvolutionDataTable,
})

export type TAccommodationEvolution = z.infer<typeof ZAccommodationEvolution>

const ZAccommodationLovacData = z.object({
  nbLogVac2Less: z.number(),
  nbLogVac2More: z.number(),
  nbTotal: z.number(),
  propLogVac2Less: z.number(),
  propLogVac2More: z.number(),
})

const ZAccommodationLovacEvolutionData = z.object({
  data: z.array(
    z.object({
      nbLogVac2Less: z.number(),
      nbLogVac2More: z.number(),
      nbTotal: z.number(),
      propLogVac2Less: z.number(),
      propLogVac2More: z.number(),
    }),
  ),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: ZMetadata,
})

const ZAccommodationLovacEvolutionDataTableRow = z.object({
  '2014': ZAccommodationLovacData,
  '2019': ZAccommodationLovacData,
  '2024': ZAccommodationLovacData,
  name: z.string(),
  annualEvolution: z.record(
    z.string(),
    z.object({
      nbLogVac2Less: z.object({
        value: z.number(),
        percent: z.string(),
      }),
      nbLogVac2More: z.object({
        value: z.number(),
        percent: z.string(),
      }),
    }),
  ),
})

export type TAccommodationLovacEvolutionDataTableRow = z.infer<typeof ZAccommodationLovacEvolutionDataTableRow>
export const ZAccommodationLovacEvolutionDataTable = z.record(z.string(), ZAccommodationLovacEvolutionDataTableRow)
export type TAccommodationLovacEvolutionDataTable = z.infer<typeof ZAccommodationLovacEvolutionDataTable>

export const ZAccommodationLovacEvolution = z.object({
  linearChart: z.record(z.string(), ZAccommodationLovacEvolutionData),
  tableData: ZAccommodationLovacEvolutionDataTable,
})
export type TAccommodationLovacEvolution = z.infer<typeof ZAccommodationLovacEvolution>
