import { ZCommonDateFields, ZEpci } from '@shared'
import { z } from 'zod'

export const ZEpciGroup = ZCommonDateFields.extend({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
})

export type TEpciGroup = z.infer<typeof ZEpciGroup>

export const ZEpciGroupWithEpcis = ZEpciGroup.extend({
  epciGroupEpcis: z.array(
    z.object({
      epciCode: z.string(),
      epci: ZEpci,
    }),
  ),
})

export type TEpciGroupWithEpcis = z.infer<typeof ZEpciGroupWithEpcis>

export const ZCreateEpciGroupDto = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  epciCodes: z.array(z.string()).min(1, 'Au moins un EPCI doit être sélectionné'),
})

export type TCreateEpciGroupDto = z.infer<typeof ZCreateEpciGroupDto>

export const ZUpdateEpciGroupDto = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne doit pas dépasser 100 caractères').optional(),
  epciCodes: z.array(z.string()).min(1, 'Au moins un EPCI doit être sélectionné').optional(),
})

export type TUpdateEpciGroupDto = z.infer<typeof ZUpdateEpciGroupDto>
