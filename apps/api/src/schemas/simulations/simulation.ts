import { ZCommonDateFields, ZEpci } from '@shared'
import { z } from 'zod'
import { ZResults } from '~/schemas/results/results'
import { ZScenario } from '~/schemas/scenarios/scenario'

export const ZSimulation = ZCommonDateFields.extend({
  datasourceId: z.string(),
  epciCode: z.string(),
  id: z.string(),
  name: z.string(),
  scenarioId: z.string(),
  userId: z.string().nullable(),
})

export type TSimulation = z.infer<typeof ZSimulation>

export const ZSimulationWithEpci = ZSimulation.pick({
  createdAt: true,
  id: true,
  name: true,
  updatedAt: true,
}).extend({
  epcis: z.array(ZEpci.omit({ region: true })),
  scenario: ZScenario.pick({
    b2_scenario: true,
    projection: true,
    millesime: true,
  }).optional(),
  epciGroup: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
})

export type TSimulationWithEpci = z.infer<typeof ZSimulationWithEpci>

export const ZSimulationWithEpciAndScenario = ZSimulationWithEpci.extend({
  scenario: ZScenario,
})

export type TSimulationWithEpciAndScenario = z.infer<typeof ZSimulationWithEpciAndScenario>

export const ZSimulationWithResults = ZSimulationWithEpciAndScenario.extend({
  results: ZResults,
})

export type TSimulationWithResults = z.infer<typeof ZSimulationWithResults>

export const ZCloneSimulationDto = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères'),
})

export type TCloneSimulationDto = z.infer<typeof ZCloneSimulationDto>

export const ZActualizeSimulationDto = z.object({
  millesime: z.string().min(1, 'Le millésime est requis'),
  name: z.string().max(100).optional(),
})

export type TActualizeSimulationDto = z.infer<typeof ZActualizeSimulationDto>

export const ZGroupedSimulationWithResults = z.object({
  name: z.string(),
  simulations: z.record(z.string(), ZSimulationWithResults),
})
export type TGroupedSimulationWithResults = z.infer<typeof ZGroupedSimulationWithResults>
