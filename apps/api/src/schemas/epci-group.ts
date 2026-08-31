import { ZCommonDateFields } from '@shared'
import { z } from 'zod'

/** Miroir de l'enum Prisma `PlanningDocumentType`. */
export const ZPlanningDocumentType = z.enum(['PLH_PLUI', 'SCOT', 'AUTRES'])

export type TPlanningDocumentType = z.infer<typeof ZPlanningDocumentType>

export const ZEpciGroup = ZCommonDateFields.extend({
  id: z.string(),
  name: z.string(),
  userId: z.string().nullable(),
  worksOnPlanningDocument: z.boolean().nullable(),
  planningDocumentType: ZPlanningDocumentType.nullable(),
  planningDocumentName: z.string().nullable(),
})

export type TEpciGroup = z.infer<typeof ZEpciGroup>

export const ZEpciGroupWithEpcis = ZEpciGroup.extend({
  epciGroupEpcis: z.array(
    z.object({
      epciCode: z.string(),
      epci: z.object({
        code: z.string(),
        name: z.string(),
        region: z.string(),
      }),
    }),
  ),
})

export type TEpciGroupWithEpcis = z.infer<typeof ZEpciGroupWithEpcis>

export const ZCreateEpciGroupDto = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  epciCodes: z.array(z.string()).min(1, 'Au moins un EPCI doit être sélectionné'),
  worksOnPlanningDocument: z.boolean().optional().nullable(),
  planningDocumentType: ZPlanningDocumentType.optional().nullable(),
  planningDocumentName: z.string().optional().nullable(),
})

export type TCreateEpciGroupDto = z.infer<typeof ZCreateEpciGroupDto>

export const ZUpdateEpciGroupDto = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères').optional(),
  epciCodes: z.array(z.string()).min(1, 'Au moins un EPCI doit être sélectionné').optional(),
})

export type TUpdateEpciGroupDto = z.infer<typeof ZUpdateEpciGroupDto>
