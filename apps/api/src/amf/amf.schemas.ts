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
