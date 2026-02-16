import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { Prisma } from '~/generated/prisma/client'
import { ScenariosService } from '~/scenarios/scenarios.service'
import { TUser } from '~/schemas/users/user'
import { SimulationsService } from '~/simulations/simulations.service'
import { UsersService } from '~/users/users.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  const userService: jest.Mocked<UsersService> = createMock<UsersService>()
  const simulationService: jest.Mocked<SimulationsService> = createMock<SimulationsService>()
  const scenarioService: jest.Mocked<ScenariosService> = createMock<ScenariosService>()

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
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
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
