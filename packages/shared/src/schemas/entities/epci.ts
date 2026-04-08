import { z } from 'zod'

export const ZEpci = z.object({
  code: z.string().max(9),
  name: z.string().min(1),
  region: z.string().max(2),
  regionName: z.string().nullable().optional(),
  departmentCode: z.string().nullable().optional(),
  departmentName: z.string().nullable().optional(),
  bassinName: z.string().nullable(),
  baseEpci: z.boolean().optional(),
})

export type TEpci = z.infer<typeof ZEpci>
