import { z } from 'zod'
import { ZPlanningDocumentType } from '~/schemas/epci-group'
import { ZInitScenario } from '~/schemas/scenarios/scenario'

/**
 * Corps de `POST /simulations`, reflet de `ZInitSimulationDto` (apps/web).
 *
 * Déclaré explicitement plutôt que dérivé de `ZSimulation` : le modèle porte des colonnes
 * que le serveur renseigne lui-même (`userId`, `scenarioId`, `epciCode`, `datasourceId`).
 */
export const ZInitSimulation = z.object({
  // Obligatoire, comme la colonne `simulations.name` qui est NOT NULL.
  name: z.string().min(1).max(100),
  millesime: z.string().max(10).optional(),
  epci: z
    .array(z.object({ code: z.string().max(9) }))
    .min(1)
    .max(50),
  scenario: ZInitScenario,
  epciGroupName: z.string().max(255).optional().nullable(),
  epciGroupId: z.string().max(64).optional().nullable(),
  worksOnPlanningDocument: z.boolean().optional().nullable(),
  planningDocumentType: ZPlanningDocumentType.optional().nullable(),
  planningDocumentName: z.string().max(255).optional().nullable(),
})

export type TInitSimulation = z.infer<typeof ZInitSimulation>
