import { ZCommonDateFields, ZEpci } from '@shared'
import { z } from 'zod'
import { ZResults } from '~/schemas/results/results'
import { ZEpciScenario, ZScenario } from '~/schemas/scenarios/scenario'

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
  userId: true,
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

// Lenient scenario schema for preview endpoint — numeric fields may arrive as strings (e.g. via URL query state).
const ZPreviewScenario = ZScenario.partial().extend({
  b1_horizon_resorption: z.coerce.number().optional(),
  b11_part_etablissement: z.coerce.number().optional(),
  b12_cohab_interg_subie: z.coerce.number().optional(),
  b13_taux_effort: z.coerce.number().optional(),
  b13_taux_reallocation: z.coerce.number().optional(),
  b14_taux_reallocation: z.coerce.number().optional(),
  b15_taux_reallocation: z.coerce.number().optional(),
  projection: z.coerce.number().optional(),
})

const ZPreviewEpciScenario = ZEpciScenario.partial().extend({
  b2_tx_disparition: z.coerce.number().optional(),
  b2_tx_restructuration: z.coerce.number().optional(),
  b2_tx_rs: z.coerce.number().optional(),
  b2_tx_vacance: z.coerce.number().optional(),
  b2_tx_vacance_courte: z.coerce.number().optional(),
  b2_tx_vacance_longue: z.coerce.number().optional(),
})

export const ZPreviewSimulationDto = z
  .object({
    simulationId: z.string().optional(),
    epcis: z.array(z.string()).optional(),
    scenario: ZPreviewScenario.optional(),
    epciScenarios: z.record(z.string(), ZPreviewEpciScenario).optional(),
  })
  .refine((d) => d.simulationId || (d.epcis && d.epcis.length > 0), {
    message: 'simulationId ou au moins un EPCI doit être fourni',
  })
export type TPreviewSimulationDto = z.infer<typeof ZPreviewSimulationDto>
