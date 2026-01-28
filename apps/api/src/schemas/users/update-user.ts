import { z } from 'zod'
import { UserType } from '~/generated/prisma/client'

export const ZUpdateUserType = z.object({
  type: z.nativeEnum(UserType),
})

export type TUpdateUserType = z.infer<typeof ZUpdateUserType>
