import { z } from 'zod'

export const ZMetadata = z.object({
  max: z.number(),
  min: z.number(),
})

export const ZOmphaleEvolution = z.object({
  centralB: z.number(),
  centralC: z.number(),
  centralH: z.number(),
  pbB: z.number(),
  pbC: z.number(),
  pbH: z.number(),
  phB: z.number(),
  phC: z.number(),
  phH: z.number(),
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
  basse: z.number(),
  central: z.number(),
  haute: z.number(),
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
