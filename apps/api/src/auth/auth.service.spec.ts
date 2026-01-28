import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { CronService } from '~/cron/cron.service'
import { Prisma } from '~/generated/prisma/client'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TSignupCallback } from '~/schemas/auth/sign-in-callback'
import { TUser } from '~/schemas/users/user'
import { SessionsService } from '~/sessions/sessions.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  const userService: jest.Mocked<UsersService> = createMock<UsersService>()
  const sessionService: jest.Mocked<SessionsService> = createMock<SessionsService>()
  const simulationService: jest.Mocked<SimulationsService> = createMock<SimulationsService>()
  const scenarioService: jest.Mocked<ScenariosService> = createMock<ScenariosService>()
  const cronService: jest.Mocked<CronService> = createMock<CronService>()

  const mockUser: TUser = {
    createdAt: new Date(),
    email: 'email',
    firstname: 'firstname',
    id: 'user-123',
    lastLoginAt: new Date(),
    lastname: 'lastname',
    provider: 'provider',
    role: 'USER',
    sub: 'sub',
    updatedAt: new Date(),
    emailVerified: null,
    hasAccess: false,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SessionsService,
          useValue: sessionService,
        },
        {
          provide: UsersService,
          useValue: userService,
        },
        {
          provide: SimulationsService,
          useValue: simulationService,
        },
        {
          provide: ScenariosService,
          useValue: scenarioService,
        },
        {
          provide: CronService,
          useValue: cronService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('validateSignIn', () => {
    const mockSignInData: TSignupCallback = {
      email: 'email',
      firstname: '',
      lastname: '',
      id: '',
      provider: 'proconnect',
    }

    it('should upsert a session if the user exists', async () => {
      userService.findByEmail = jest.fn().mockResolvedValueOnce(mockUser)

      await service.validateProConnectSignIn(mockSignInData)
      expect(sessionService.upsert).toHaveBeenCalledWith(mockUser)
    })

    it('should call handleUserAccessUpdate when signing up', async () => {
      userService.create = jest.fn().mockResolvedValueOnce(mockUser)
      userService.isEmailInWhitelist = jest.fn().mockResolvedValueOnce(false)
      await service.signUp({ email: 'email', firstname: 'firstname', lastname: 'lastname', password: 'password' })
      expect(cronService.handleUserAccessUpdate).toHaveBeenCalled()
    })

    it('should call handleUserAccessUpdate when signing in with proconnect', async () => {
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

    it('should set hasAccess to true when email is in whitelist during signup', async () => {
      userService.create = jest.fn().mockResolvedValueOnce(mockUser)
      userService.isEmailInWhitelist = jest.fn().mockResolvedValueOnce(true)

      await service.signUp({ email: 'whitelisted@example.com', firstname: 'firstname', lastname: 'lastname', password: 'password' })

      expect(userService.isEmailInWhitelist).toHaveBeenCalledWith('whitelisted@example.com')
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: true,
        }),
      )
    })

    it('should set hasAccess to false when email is not in whitelist during signup', async () => {
      userService.create = jest.fn().mockResolvedValueOnce(mockUser)
      userService.isEmailInWhitelist = jest.fn().mockResolvedValueOnce(false)

      await service.signUp({ email: 'notwhitelisted@example.com', firstname: 'firstname', lastname: 'lastname', password: 'password' })

      expect(userService.isEmailInWhitelist).toHaveBeenCalledWith('notwhitelisted@example.com')
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAccess: false,
        }),
      )
    })

    it('should set hasAccess to true when email is in whitelist during ProConnect signin', async () => {
      userService.findByEmail = jest.fn().mockResolvedValueOnce(null) // User doesn't exist
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
      userService.findByEmail = jest.fn().mockResolvedValueOnce(null) // User doesn't exist
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
