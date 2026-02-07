import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { CronService } from '~/cron/cron.service'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly simulationsService: SimulationsService,
    private readonly scenariosService: ScenariosService,
    private readonly cronService: CronService,
    private readonly prisma: PrismaService,
  ) {}

  async validateProConnectSignIn(signInData: TSignupCallback) {
    const { email } = signInData

    let user = await this.usersService.findByEmail(email)

    if (!user) {
      // Check if email is in whitelist to determine hasAccess
      const isInWhitelist = await this.usersService.isEmailInWhitelist(email)

      user = await this.usersService.create({
        email,
        name: `${signInData.firstname} ${signInData.lastname}`,
        firstname: signInData.firstname,
        lastname: signInData.lastname,
        lastLoginAt: new Date(),
        emailVerified: true,
        hasAccess: isInWhitelist,
      })

      // Create the ProConnect account
      await this.prisma.account.create({
        data: {
          userId: user.id,
          providerId: 'proconnect',
          accountId: signInData.sub ?? email,
        },
      })

      await this.cronService.handleUserAccessUpdate()
    }

    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    })

    return { user }
  }

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
