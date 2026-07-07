import { z } from 'zod'

export const ZMetadata = z.object({
  max: z.number(),
  min: z.number(),
})

export const ZOmphaleEvolution = z.object({
  centralB: z.number().nullable(),
  centralC: z.number().nullable(),
  centralH: z.number().nullable(),
  pbB: z.number().nullable(),
  pbC: z.number().nullable(),
  pbH: z.number().nullable(),
  phB: z.number().nullable(),
  phC: z.number().nullable(),
  phH: z.number().nullable(),
  year: z.number(),
})
export type TOmphaleEvolution = z.infer<typeof ZOmphaleEvolution>

export const ZOmphaleDemographicEvolution = z.record(
  z.string(),
  z.object({
    data: z.array(ZOmphaleEvolution),
    metadata: ZMetadata,
  }),
)

export type TOmphaleDemographicEvolution = z.infer<typeof ZOmphaleDemographicEvolution>

export const ZPopulationEvolution = z.object({
  basse: z.number().nullable(),
  central: z.number().nullable(),
  haute: z.number().nullable(),
  year: z.number(),
})
export type TPopulationEvolution = z.infer<typeof ZPopulationEvolution>

export const ZPopulationDemographicEvolution = z.record(
  z.string(),
  z.object({
    data: z.array(ZPopulationEvolution),
    metadata: ZMetadata,
  }),
)

export type TPopulationDemographicEvolution = z.infer<typeof ZPopulationDemographicEvolution>
