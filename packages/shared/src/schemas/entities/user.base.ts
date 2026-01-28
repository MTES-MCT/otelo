import { z } from 'zod'
import { Role } from '../../enums/role'
import { ZCommonDateFields } from '../common/date-fields'

export const ZUserBase = ZCommonDateFields.extend({
  id: z.string(),
  email: z.email(),
  firstname: z.string(),
  lastname: z.string(),
  role: z.enum([Role.ADMIN, Role.USER]),
  hasAccess: z.boolean(),
})

export type TUserBase = z.infer<typeof ZUserBase>
