import { ZEpci } from '@shared'
import { createZodDto } from 'nestjs-zod'

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

export class CreateEpciDto extends createZodDto(ZCreateEpci) {}
export class UpdateEpciDto extends createZodDto(ZUpdateEpci) {}
