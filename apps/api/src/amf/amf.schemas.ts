import { z } from 'zod'

const ZAmfEpciCode = z.string().regex(/^\d{9}$/)

export const ZAmfEpciParams = z.object({ epciCode: ZAmfEpciCode })
export type TAmfEpciParams = z.output<typeof ZAmfEpciParams>

export const ZAmfAnswers = z.object({
  epciCode: ZAmfEpciCode,
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

export const ZAmfShareContactsBody = z.object({
  contacts: z
    .array(z.object({ role: z.string().trim().min(1).max(100), email: z.email() }))
    .min(1)
    .max(10),
})
export type TAmfShareContactsBody = z.output<typeof ZAmfShareContactsBody>

export const ZAmfCreateSimulationResponse = z.object({ leadId: z.uuid(), result: ZAmfResult })
export type TAmfCreateSimulationResponse = z.output<typeof ZAmfCreateSimulationResponse>
