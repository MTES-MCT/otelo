import { createMock } from '@golevelup/ts-jest'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { TSession } from '~/schemas/sessions/session'
import { TUser } from '~/schemas/users/user'
import { UsersService } from '~/users/users.service'
import { SessionsService } from './sessions.service'

describe('SessionsService', () => {
  let service: SessionsService
  let prismaService: jest.Mocked<PrismaService>

  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: createMock<JwtService>(),
        },
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>(),
        },
        {
          provide: UsersService,
          useValue: createMock<UsersService>(),
        },
      ],
    }).compile()

    service = module.get<SessionsService>(SessionsService)
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('isValidToken', () => {
    it('should return true for a valid token', async () => {
      const mockSession = {
        accessToken: 'valid-token',
        expiresAt: new Date('2024-12-02T10:12:53.555Z'),
        id: '1',
        refreshToken: 'valid-refresh-token',
      }
      mockPrismaService.session.findFirst = jest.fn().mockResolvedValue(mockSession)

      const result = await service.isValidToken('valid-token')
      expect(result).toBe(mockSession)
      expect(prismaService.session.findFirst).toHaveBeenCalled()
    })

    it('should return false for an invalid token', async () => {
      prismaService.session.findFirst = jest.fn().mockResolvedValue(null)

      const result = await service.isValidToken('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('upsert', () => {
    it('should create a new session', async () => {
      const createSessionDto = {
        accessToken: 'new-token',
        expiresAt: new Date(),
        refreshToken: 'new-refresh-token',
        userId: 'user-123',
      }
      const mockCreatedSession: TSession = {
        id: 'session-1',
        ...createSessionDto,
        createdAt: new Date(),
      }

      const mockUser = {} as TUser
      prismaService.session.create = jest.fn().mockResolvedValue(mockCreatedSession)

      const result = await service.upsert(mockUser)
      expect(result).toEqual(mockCreatedSession)
      expect(prismaService.session.create).toHaveBeenCalled()
    })

    it('should update an existing session', async () => {
      const updateSessionDto: TSession = {
        accessToken: 'updated-token',
        createdAt: new Date(),
        expiresAt: new Date(),
        id: 'session-1',
        refreshToken: 'updated-refresh-token',
        userId: 'user-123',
      }
      const mockUser = {} as TUser
      prismaService.session.findFirst = jest.fn().mockResolvedValue(updateSessionDto)
      prismaService.session.update = jest.fn().mockResolvedValue(updateSessionDto)

      const result = await service.upsert(mockUser)
      expect(result).toEqual(updateSessionDto)
      expect(prismaService.session.update).toHaveBeenCalled()
    })
  })

  describe('deleteByToken', () => {
    it('should delete a session when token exists', async () => {
      const mockSession = { id: 'session-1', token: 'existing-token' }
      prismaService.session.findFirst = jest.fn().mockResolvedValue(mockSession)

      await service.deleteByToken('existing-token')
      expect(prismaService.session.findFirst).toHaveBeenCalledWith({
        where: { accessToken: 'existing-token' },
      })
      expect(prismaService.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      })
    })

    it('should not attempt to delete when token does not exist', async () => {
      prismaService.session.findFirst = jest.fn().mockResolvedValue(null)

      await service.deleteByToken('non-existing-token')
      expect(prismaService.session.findFirst).toHaveBeenCalledWith({
        where: { accessToken: 'non-existing-token' },
      })
      expect(prismaService.session.delete).not.toHaveBeenCalled()
    })
  })
})
