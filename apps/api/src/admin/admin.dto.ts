import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ZUpdateUserAccess = z.object({
  hasAccess: z.boolean(),
})

export const ZUpdateUserRegion = z.object({
  region: z.string().max(2).nullable(),
})

export class UpdateUserAccessDto extends createZodDto(ZUpdateUserAccess) {}
export class UpdateUserRegionDto extends createZodDto(ZUpdateUserRegion) {}
