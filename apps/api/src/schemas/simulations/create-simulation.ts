import { ZEpci } from '@shared'
import { z } from 'zod'
import { ZPlanningDocumentType } from '~/schemas/epci-group'
import { ZInitScenario } from '~/schemas/scenarios/scenario'
import { ZSimulation } from './simulation'

export const ZCreateSimulation = ZSimulation.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
})

export type TCreateSimulation = z.infer<typeof ZCreateSimulation>

export const ZInitSimulation = ZCreateSimulation.extend({
  name: z.string(),
  epci: z.array(ZEpci.omit({ name: true })),
  scenario: ZInitScenario,
  millesime: z.string().optional(),
  epciGroupName: z.string().optional().nullable(),
  epciGroupId: z.string().optional().nullable(),
  worksOnPlanningDocument: z.boolean().optional().nullable(),
  planningDocumentType: ZPlanningDocumentType.optional().nullable(),
  planningDocumentName: z.string().optional().nullable(),
})

export type TInitSimulation = z.infer<typeof ZInitSimulation>
