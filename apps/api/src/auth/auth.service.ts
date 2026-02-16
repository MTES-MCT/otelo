import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { Prisma } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly simulationsService: SimulationsService,
    private readonly scenariosService: ScenariosService,
  ) {}

  hasRole(user: TUser | undefined, roles: Role[]): boolean {
    const userRole = user?.role
    return roles.some((role) => role === userRole)
  }

  async canAccessEntity(entity: unknown, paramName: string, user: TUser | undefined, request: Request): Promise<boolean> {
    const entityId: string = paramName && (request.params[paramName] as string)
    if (user) {
      switch (entity) {
        case Prisma.ModelName.Scenario:
          return this.scenariosService.hasUserAccessTo(entityId, user.id)
        case Prisma.ModelName.Simulation:
          return this.simulationsService.hasUserAccessTo(entityId, user.id)
        default:
          throw new Error(`Entity not supported in Control Access`)
      }
    }

    return false
  }

  async hasAccess(email: string) {
    return this.usersService.hasUserAccessTo(email)
  }
}
