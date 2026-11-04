import { ZEpci } from '@otelo/shared'
import type { z } from 'zod'

const EDITABLE_FIELDS = {
  bassinName: true,
  departmentCode: true,
  departmentName: true,
  name: true,
  region: true,
  regionName: true,
} as const

export const ZCreateEpci = ZEpci.pick({ code: true, ...EDITABLE_FIELDS })

export const ZUpdateEpci = ZEpci.pick(EDITABLE_FIELDS).partial()
export type TCreateEpci = z.output<typeof ZCreateEpci>
export type TUpdateEpci = z.output<typeof ZUpdateEpci>
