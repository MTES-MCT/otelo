import { z } from 'zod'
import { ZCommonDateFields } from '../common/date-fields'

export const ZSimulationBase = ZCommonDateFields.extend({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  epciCode: z.string(),
  datasourceId: z.string(),
  scenarioId: z.string(),
})

export type TSimulationBase = z.infer<typeof ZSimulationBase>

export const ZCloneSimulationDto = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères'),
})

export type TCloneSimulationDto = z.infer<typeof ZCloneSimulationDto>
