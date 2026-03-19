import { z } from 'zod'

export const ZTemplateStatisticsRow = z.object({
  Prénom: z.string(),
  Nom: z.string(),
  Email: z.string(),
  'Date de création compte Otelo': z.string(),
  'Date derniere estimation': z.string().nullable(),
  'EPCIs Code estimés': z.string(),
  'Date dernier Export Résultats Excel': z.string().nullable(),
  'EPCI Export Résultats Excel': z.string(),
  'Date dernier Export PPT': z.string().nullable(),
  'EPCI Export PPT': z.string(),
})

export type TTemplateStatisticsRow = z.infer<typeof ZTemplateStatisticsRow>
