import { z } from 'zod'

export const ZAmfAnswers = z.object({
  epciCode: z.string().regex(/^\d{9}$/),
  demography: z.enum(['plus', 'tendance', 'moins']),
  vacancy: z.enum(['prioritaire', 'parmi-autres', 'non']),
  badHousing: z.boolean(),
  secondaryResidences: z.enum(['neutre', 'reguler', 'developper']),
})
export const ZAmfCreateSimulationBody = ZAmfAnswers.extend({ email: z.email() })

export type TAmfAnswers = z.output<typeof ZAmfAnswers>
export type TAmfCreateSimulationBody = z.output<typeof ZAmfCreateSimulationBody>

export const ZAmfResult = z.object({
  baseYear: z.number(),
  horizon: z.number(),
  total: z.number(),
  annualAverage: z.number(),
  blocks: z
    .object({
      population: z.number(),
      vacancy: z.number(),
      secondaryResidences: z.number(),
      badHousing: z.number(),
    })
    .nullable(),
})
export type TAmfResult = z.output<typeof ZAmfResult>

export const ZAmfEpci = z.object({
  code: z.string(),
  name: z.string(),
  fragileProjection: z.boolean(),
  baseYear: z.number(),
  horizon: z.number(),
  populationChanges: z.object({
    haute: z.number(),
    central: z.number(),
    basse: z.number().nullable(),
  }),
})
export type TAmfEpci = z.output<typeof ZAmfEpci>
