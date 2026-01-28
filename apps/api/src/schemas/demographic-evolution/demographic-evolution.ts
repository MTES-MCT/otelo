import { z } from 'zod'

export enum EOmphale {
  CENTRAL_B = 'centralB',
  CENTRAL_C = 'centralC',
  CENTRAL_H = 'centralH',
  PB_B = 'pbB',
  PB_C = 'pbC',
  PB_H = 'pbH',
  PH_B = 'phB',
  PH_C = 'phC',
  PH_H = 'phH',
}

export const ZGetDemographicEvolutionByYearAndOmphaleQuery = z.object({
  epciCode: z.string(),
  omphale: z.enum([
    EOmphale.CENTRAL_B,
    EOmphale.CENTRAL_C,
    EOmphale.CENTRAL_H,
    EOmphale.PH_B,
    EOmphale.PH_C,
    EOmphale.PH_H,
    EOmphale.PB_B,
    EOmphale.PB_C,
    EOmphale.PB_H,
  ]),
  year: z.number(),
})

export type TGetDemographicEvolutionByYearAndOmphaleQuery = z.infer<typeof ZGetDemographicEvolutionByYearAndOmphaleQuery>

export const ZGetDemographicEvolutionByOmphaleQuery = ZGetDemographicEvolutionByYearAndOmphaleQuery.pick({
  epciCode: true,
  omphale: true,
})

export type TGetDemographicEvolutionByOmphaleQuery = z.infer<typeof ZGetDemographicEvolutionByOmphaleQuery>

export const ZGetDemographicEvolution = z.object({
  centralB: z.number().optional(),
  centralC: z.number().optional(),
  centralH: z.number().optional(),
  epciCode: z.string(),
  pbB: z.number().optional(),
  pbC: z.number().optional(),
  pbH: z.number().optional(),
  phB: z.number().optional(),
  phC: z.number().optional(),
  phH: z.number().optional(),
  year: z.number(),
})

export type TGetDemographicEvolution = z.infer<typeof ZGetDemographicEvolution>

export const ZDemographicEvolution = z.object({
  data: z.array(
    z.object({
      value: z.number(),
      year: z.number(),
      yearValue: z.number(),
      previousYearValue: z.number(),
    }),
  ),
  metadata: z.object({
    data: z.object({
      max: z.number(),
      min: z.number(),
    }),
    period: z.object({
      endYear: z.number(),
      startYear: z.number(),
    }),
  }),
})

export type TDemographicEvolution = z.infer<typeof ZDemographicEvolution>

export const ZDemographicEvolutionByEpci = z.object({
  basse: z.number(),
  central: z.number(),
  haute: z.number(),
  year: z.number(),
})

export type TDemographicEvolutionByEpci = z.infer<typeof ZDemographicEvolutionByEpci>

export const ZDemographicEvolutionPopulationMaxYearsByEpci = z.object({})
export const ZGetDemographicEvolutionByEpciQuery = z.object({
  epciCodes: z.string(),
})

export type TGetDemographicEvolutionByEpciQuery = z.infer<typeof ZGetDemographicEvolutionByEpciQuery>

export const ZDemographicEvolutionMenagesByEpci = z.object({
  centralB: z.number().optional(),
  centralC: z.number().optional(),
  centralH: z.number().optional(),
  pbB: z.number().optional(),
  pbC: z.number().optional(),
  pbH: z.number().optional(),
  phB: z.number().optional(),
  phC: z.number().optional(),
  phH: z.number().optional(),
  year: z.number(),
})

export type TDemographicEvolutionMenagesByEpci = z.infer<typeof ZDemographicEvolutionMenagesByEpci>

export const ZDemographicEvolutionPopulationByEpciAndYear = z.object({
  data: z.array(
    z.object({
      year: z.number(),
      central: z.number(),
      haute: z.number(),
      basse: z.number(),
    }),
  ),
  metadata: z.object({ max: z.number(), min: z.number() }),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
})

export type TDemographicEvolutionPopulationByEpciAndYear = z.infer<typeof ZDemographicEvolutionPopulationByEpciAndYear>

export const ZDemographicEvolutionPopulationByEpciRecord = z.record(
  z.string(),
  z.object({
    data: z.array(
      z.object({
        year: z.number(),
        central: z.number(),
        haute: z.number(),
        basse: z.number(),
      }),
    ),
    metadata: z.object({ max: z.number(), min: z.number() }),
  }),
)

export type TDemographicEvolutionPopulationByEpciRecord = z.infer<typeof ZDemographicEvolutionPopulationByEpciRecord>

export const ZDemographicPopulationMaxYearsByEpci = z.record(
  z.string(),
  z.object({
    central: z.object({ value: z.number(), year: z.number() }),
    haute: z.object({ value: z.number(), year: z.number() }),
    basse: z.object({ value: z.number(), year: z.number() }),
  }),
)

export type TDemographicPopulationMaxYearsByEpci = z.infer<typeof ZDemographicPopulationMaxYearsByEpci>

export const ZDemographicMenagesMaxYearsByEpci = z.record(
  z.string(),
  z.object({
    centralB: z.object({ value: z.number(), year: z.number() }),
    centralC: z.object({ value: z.number(), year: z.number() }),
    centralH: z.object({ value: z.number(), year: z.number() }),
    phB: z.object({ value: z.number(), year: z.number() }),
    phC: z.object({ value: z.number(), year: z.number() }),
    phH: z.object({ value: z.number(), year: z.number() }),
    pbB: z.object({ value: z.number(), year: z.number() }),
    pbC: z.object({ value: z.number(), year: z.number() }),
    pbH: z.object({ value: z.number(), year: z.number() }),
  }),
)

export type TDemographicMenagesMaxYearsByEpci = z.infer<typeof ZDemographicMenagesMaxYearsByEpci>

export const ZDemographicEvolutionMenagesByEpciAndYear = z.object({
  data: z.array(
    z.object({
      year: z.number(),
      centralB: z.number(),
      centralC: z.number(),
      centralH: z.number(),
      phB: z.number(),
      phC: z.number(),
      phH: z.number(),
      pbB: z.number(),
      pbC: z.number(),
      pbH: z.number(),
    }),
  ),
  metadata: z.object({ max: z.number(), min: z.number() }),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
})

export type TDemographicEvolutionMenagesByEpciAndYear = z.infer<typeof ZDemographicEvolutionMenagesByEpciAndYear>

export const ZDemographicEvolutionMenagesByEpciRecord = z.record(
  z.string(),
  z.object({
    data: z.array(
      z.object({
        year: z.number(),
        centralB: z.number(),
        centralC: z.number(),
        centralH: z.number(),
        phB: z.number(),
        phC: z.number(),
        phH: z.number(),
        pbB: z.number(),
        pbC: z.number(),
        pbH: z.number(),
      }),
    ),
    metadata: z.object({ max: z.number(), min: z.number() }),
  }),
)

export type TDemographicEvolutionMenagesByEpciRecord = z.infer<typeof ZDemographicEvolutionMenagesByEpciRecord>
