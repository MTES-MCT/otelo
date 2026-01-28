import { z } from 'zod'
import { ZMetadata } from '~/schemas/demographic-evolution'

const ZPopulationEvolution = z.object({
  population: z.number(),
  year: z.number(),
})

const ZTerritoryPopulationData = z.object({
  data: z.array(ZPopulationEvolution),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: ZMetadata,
})

export type TTerritoryPopulationData = z.infer<typeof ZTerritoryPopulationData>

export const ZRPDataTable = z.record(
  z.string(),
  z
    .object({
      annualEvolution: z.record(
        z.string(),
        z.object({
          percent: z.string(),
          value: z.number(),
        }),
      ),
      name: z.string(),
    })
    .and(
      z.record(
        z.string(),
        z.object({
          value: z.number(),
        }),
      ),
    ),
)

export type TRPDataTable = z.infer<typeof ZRPDataTable>

export const ZRPPopulationEvolution = z.object({
  linearChart: z.record(z.string(), ZTerritoryPopulationData),
  tableData: ZRPDataTable,
})

export type TRPPopulationEvolution = z.infer<typeof ZRPPopulationEvolution>

const ZDemographicProjectionDataTableRow = z.object({
  '2021': z.object({
    basse: z.number(),
    central: z.number(),
    haute: z.number(),
  }),
  '2030': z.object({
    basse: z.number(),
    central: z.number(),
    haute: z.number(),
  }),
  '2040': z.object({
    basse: z.number(),
    central: z.number(),
    haute: z.number(),
  }),
  '2050': z.object({
    basse: z.number(),
    central: z.number(),
    haute: z.number(),
  }),
  maxYears: z.object({
    basse: z.number(),
    central: z.number(),
    haute: z.number(),
  }),
  annualEvolution: z.record(
    z.string(),
    z.object({
      basse: z.object({
        percent: z.string(),
        value: z.number(),
      }),
      central: z.object({
        percent: z.string(),
        value: z.number(),
      }),
      haute: z.object({
        percent: z.string(),
        value: z.number(),
      }),
    }),
  ),
  name: z.string(),
})

export type TDemographicProjectionDataTableRow = z.infer<typeof ZDemographicProjectionDataTableRow>

export const ZDemographicProjectionDataTable = z.record(z.string(), ZDemographicProjectionDataTableRow)

export type TDemographicProjectionDataTable = z.infer<typeof ZDemographicProjectionDataTable>

const ZDemographicProjectionEvolutionData = z.object({
  data: z.array(z.object({ basse: z.number(), central: z.number(), haute: z.number(), year: z.number() })),
  epci: z.object({
    code: z.string(),
    name: z.string(),
  }),
  metadata: ZMetadata,
})

export const ZDemographicPopulationMaxYearsByEpci = z.record(
  z.string(),
  z.object({
    central: z.object({ value: z.number(), year: z.number() }),
    haute: z.object({ value: z.number(), year: z.number() }),
    basse: z.object({ value: z.number(), year: z.number() }),
  }),
)

export type TDemographicMaxYearsByEpci = z.infer<typeof ZDemographicPopulationMaxYearsByEpci>

export const ZDemographicProjectionEvolution = z.object({
  linearChart: z.record(z.string(), ZDemographicProjectionEvolutionData),
  tableData: ZDemographicProjectionDataTable,
  maxYears: ZDemographicPopulationMaxYearsByEpci,
})

export type TDemographicProjectionEvolution = z.infer<typeof ZDemographicProjectionEvolution>

export const ZDemographicMenagesByEpci = z.object({
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

export type TDemographicMenagesByEpci = z.infer<typeof ZDemographicMenagesByEpci>

export const ZDemographicMenagesMaxYearsByEpci = z.record(
  z.string(),
  z.object({
    centralB: z.object({ value: z.number(), year: z.number() }),
    centralC: z.object({ value: z.number(), year: z.number() }),
    centralH: z.object({ value: z.number(), year: z.number() }),
    pbB: z.object({ value: z.number(), year: z.number() }),
    pbC: z.object({ value: z.number(), year: z.number() }),
    pbH: z.object({ value: z.number(), year: z.number() }),
    phC: z.object({ value: z.number(), year: z.number() }),
    phB: z.object({ value: z.number(), year: z.number() }),
    phH: z.object({ value: z.number(), year: z.number() }),
  }),
)

export type TDemographicMenagesMaxYearsByEpci = z.infer<typeof ZDemographicMenagesMaxYearsByEpci>

export const ZDemographicMenagesEvolution = z.object({
  linearChart: z.record(z.string(), ZDemographicMenagesByEpci),
  tableData: ZDemographicProjectionDataTable,
  maxYears: ZDemographicMenagesMaxYearsByEpci,
})

export type TDemographicMenagesEvolution = z.infer<typeof ZDemographicMenagesEvolution>

export const ZInadequateHousing = z.record(
  z.string(),
  z.object({
    hosted: z.object({
      total: z.number(),
      sne: z.number(),
      filocom: z.number(),
    }),
    noAccommodation: z.object({
      total: z.number(),
      hotel: z.number(),
      homeless: z.number(),
      makeShiftHousing: z.number(),
      finess: z.number(),
    }),
    badQuality: z.number(),
    financialInadequation: z.number(),
    physicalInadequation: z.number(),
    name: z.string(),
  }),
)

export type TInadequateHousing = z.infer<typeof ZInadequateHousing>
