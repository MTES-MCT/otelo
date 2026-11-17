import { SetMetadata } from '@nestjs/common'
import { Role, UserType } from '~/generated/prisma/enums'

export const ACCESS_CONTROL_KEY = 'access-control'

export type TModelAccess = {
  entity?: unknown
  paramName?: string
  roles: Role[]
  /** Types de compte autorisés en plus des rôles, la condition étant un « ou ». */
  userTypes?: UserType[]
}

export const isInternalOnly = (modelAccess: TModelAccess): boolean => !modelAccess.roles.includes(Role.USER)

export const AccessControl = (modelAccess: TModelAccess) => SetMetadata(ACCESS_CONTROL_KEY, modelAccess)
