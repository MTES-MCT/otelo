import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { CronService } from '~/cron/cron.service'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  const userService: jest.Mocked<UsersService> = createMock<UsersService>()
  const simulationService: jest.Mocked<SimulationsService> = createMock<SimulationsService>()
  const scenarioService: jest.Mocked<ScenariosService> = createMock<ScenariosService>()
  const cronService: jest.Mocked<CronService> = createMock<CronService>()
  const prismaService: jest.Mocked<PrismaService> = createMock<PrismaService>()

  const mockUser: TUser = {
    createdAt: new Date(),
    email: 'email',
    name: 'firstname lastname',
    image: null,
    firstname: 'firstname',
    id: 'user-123',
    lastLoginAt: new Date(),
    lastname: 'lastname',
    role: 'USER',
    updatedAt: new Date(),
    emailVerified: true,
    hasAccess: false,
    engaged: false,
    type: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: userService },
        { provide: SimulationsService, useValue: simulationService },
        { provide: ScenariosService, useValue: scenarioService },
        { provide: CronService, useValue: cronService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('validateProConnectSignIn', () => {
    const mockSignInData: TSignupCallback = {
      email: 'email',
      firstname: 'firstname',
      lastname: 'lastname',
      id: 'id',
      provider: 'proconnect',
    }

    it('should update lastLoginAt if the user exists', async () => {
      userService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser)

      await service.validateProConnectSignIn(mockSignInData)
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, expect.objectContaining({ lastLoginAt: expect.any(Date) }))
    })

    it('should create a user and call handleUserAccessUpdate when signing in with proconnect for the first time', async () => {
      userService.findByEmail = jest.fn().mockResolvedValueOnce(null)
      userService.create = jest.fn().mockResolvedValueOnce(mockUser)
      userService.isEmailInWhitelist = jest.fn().mockResolvedValueOnce(false)

      await service.validateProConnectSignIn({
        email: 'email',
        firstname: 'firstname',
        lastname: 'lastname',
        sub: 'sub',
        id: 'id',
        provider: 'proconnect',
      })
      expect(cronService.handleUserAccessUpdate).toHaveBeenCalled()
    })

    it('should set hasAccess to true when email is in whitelist during ProConnect signin', async () => {
      userService.findByEmail = jest.fn().mockResolvedValueOnce(null)
      userService.create = jest.fn().mockResolvedValueOnce(mockUser)
      userService.isEmailInWhitelist = jest.fn().mockResolvedValueOnce(true)

      await service.validateProConnectSignIn({
        email: 'whitelisted@example.com',
        firstname: 'firstname',
        lastname: 'lastname',
        sub: 'sub',
        id: 'id',
        provider: 'proconnect',
      })

      expect(userService.isEmailInWhitelist).toHaveBeenCalledWith('whitelisted@example.com')
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: true,
        }),
      )
    })

    it('should set hasAccess to false when email is not in whitelist during ProConnect signin', async () => {
      userService.findByEmail = jest.fn().mockResolvedValueOnce(null)
      userService.create = jest.fn().mockResolvedValueOnce(mockUser)
      userService.isEmailInWhitelist = jest.fn().mockResolvedValueOnce(false)

      await service.validateProConnectSignIn({
        email: 'notwhitelisted@example.com',
        firstname: 'firstname',
        lastname: 'lastname',
        sub: 'sub',
        id: 'id',
        provider: 'proconnect',
      })

      expect(userService.isEmailInWhitelist).toHaveBeenCalledWith('notwhitelisted@example.com')
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: false,
        }),
      )
    })
  })

  describe('hasRole', () => {
    it('should return true if the user has the role', () => {
      expect(service.hasRole(mockUser, ['USER'])).toBe(true)
    })

    it('should return false if the user does not have the role', () => {
      expect(service.hasRole(mockUser, ['ADMIN'])).toBe(false)
    })
  })

  describe('canAccessEntity', () => {
    const request = {
      params: {
        id: 'id',
      },
    } as unknown as Request

    it('should return false if the user is undefined', async () => {
      const result = await service.canAccessEntity(Prisma.ModelName.Scenario, 'id', undefined, request)
      expect(result).toBe(false)
    })

    it('should return true if the user has access to the scenario entity', async () => {
      scenarioService.hasUserAccessTo = jest.fn().mockResolvedValueOnce(true)
      const result = await service.canAccessEntity(Prisma.ModelName.Scenario, 'id', mockUser, request)
      expect(result).toBe(true)
    })

    it('should return true if the user has access to the simulation entity', async () => {
      simulationService.hasUserAccessTo = jest.fn().mockResolvedValueOnce(true)
      const result = await service.canAccessEntity(Prisma.ModelName.Simulation, 'id', mockUser, request)
      expect(result).toBe(true)
    })

    it('should throw if the user does not have access to the entity', async () => {
      expect(service.canAccessEntity('any-other-entity', 'id', mockUser, request)).rejects.toThrow('Entity not supported')
    })
  })
})
