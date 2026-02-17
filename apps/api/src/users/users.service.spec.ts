import { createMock } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { TUser } from '~/schemas/users/user'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let prismaService: jest.Mocked<PrismaService>

  const mockPrismaService = createMock<PrismaService>()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('hasUserAccessTo', () => {
    it('should return true when a user is found', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({ id: 'user-1' })
    })

    it('should return false when no user is found', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null)
      const result = await service.hasUserAccessTo('user-1')
      expect(result).toBe(false)
    })
  })

  describe('isEmailInWhitelist', () => {
    it('should return true when email is in whitelist', async () => {
      prismaService.userWhitelist.findUnique = jest.fn().mockResolvedValue({ email: 'whitelisted@example.com' })
      const result = await service.isEmailInWhitelist('whitelisted@example.com')
      expect(result).toBe(true)
      expect(prismaService.userWhitelist.findUnique).toHaveBeenCalledWith({
        where: { email: 'whitelisted@example.com' },
      })
    })

    it('should return false when email is not in whitelist', async () => {
      prismaService.userWhitelist.findUnique = jest.fn().mockResolvedValue(null)
      const result = await service.isEmailInWhitelist('notwhitelisted@example.com')
      expect(result).toBe(false)
      expect(prismaService.userWhitelist.findUnique).toHaveBeenCalledWith({
        where: { email: 'notwhitelisted@example.com' },
      })
    })
  })

  describe('getByToken', () => {
    it('should return a user when a valid token is provided', async () => {
      const mockUser: TUser = {
        createdAt: new Date('2024-01-01'),
        email: 'test@example.com',
        name: 'firstname lastname',
        image: null,
        firstname: 'firstname',
        id: 'user-1',
        lastLoginAt: new Date('2024-01-01'),
        lastname: 'lastname',
        role: 'USER',
        updatedAt: new Date('2024-01-01'),
        emailVerified: true,
        hasAccess: false,
        engaged: false,
        type: null,
      }

      prismaService.user.findFirstOrThrow = jest.fn().mockResolvedValue(mockUser)

      const result = await service.getByToken('valid-token')
      expect(result).toEqual(mockUser)
      expect(prismaService.user.findFirstOrThrow).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          email: true,
          emailVerified: true,
          engaged: true,
          firstname: true,
          hasAccess: true,
          id: true,
          image: true,
          lastLoginAt: true,
          lastname: true,
          name: true,
          role: true,
          type: true,
          updatedAt: true,
        },
        where: {
          sessions: { some: { token: 'valid-token' } },
        },
      })
    })

    it('should throw NotFoundException when user is not found', async () => {
      prismaService.user.findFirstOrThrow = jest.fn().mockRejectedValue(new NotFoundException('User not found'))

      await expect(service.getByToken('invalid-token')).rejects.toThrow(NotFoundException)
      expect(prismaService.user.findFirstOrThrow).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          email: true,
          emailVerified: true,
          engaged: true,
          firstname: true,
          hasAccess: true,
          id: true,
          image: true,
          lastLoginAt: true,
          lastname: true,
          name: true,
          role: true,
          type: true,
          updatedAt: true,
        },
        where: {
          sessions: { some: { token: 'invalid-token' } },
        },
      })
    })
  })

  describe('list', () => {
    it('should return paginated users with default params', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
          firstname: 'Test',
          lastname: 'User',
          role: 'USER',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          emailVerified: true,
          lastLoginAt: new Date('2024-01-01'),
          hasAccess: false,
          engaged: false,
          type: null,
        },
      ]
      prismaService.user.findMany = jest.fn().mockResolvedValue(mockUsers)
      prismaService.user.count = jest.fn().mockResolvedValue(1)

      const result = await service.list()
      expect(result).toEqual({
        users: mockUsers,
        userCount: 1,
        page: 1,
        limit: 25,
        totalPages: 1,
      })
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true, email: true }),
        skip: 0,
        take: 25,
      })
    })

    it('should apply pagination with custom page and limit', async () => {
      prismaService.user.findMany = jest.fn().mockResolvedValue([])
      prismaService.user.count = jest.fn().mockResolvedValue(100)

      const result = await service.list(3, 10)
      expect(result).toEqual({
        users: [],
        userCount: 100,
        page: 3,
        limit: 10,
        totalPages: 10,
      })
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true, email: true }),
        skip: 20,
        take: 10,
      })
    })
  })

  describe('findByEmail', () => {
    it('should return a user when a valid email is provided', async () => {
      const mockUser: TUser = {
        createdAt: new Date('2024-01-01'),
        email: 'test@example.com',
        name: 'firstname lastname',
        image: null,
        firstname: 'firstname',
        id: 'user-1',
        lastLoginAt: new Date('2024-01-01'),
        lastname: 'lastname',
        role: 'USER',
        updatedAt: new Date('2024-01-01'),
        emailVerified: true,
        hasAccess: false,
        engaged: false,
        type: null,
      }
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      const result = await service.findByEmail('test@example.com')
      expect(result).toEqual(mockUser)
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          email: true,
          emailVerified: true,
          engaged: true,
          firstname: true,
          hasAccess: true,
          id: true,
          image: true,
          lastLoginAt: true,
          lastname: true,
          name: true,
          role: true,
          type: true,
          updatedAt: true,
        },
        where: { email: 'test@example.com' },
      })
    })

    it('should return null when no user is found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      const result = await service.findByEmail('nonexistent@example.com')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a user', async () => {
      const mockUser: TUser = {
        createdAt: new Date('2024-01-01'),
        email: 'test@example.com',
        name: 'firstname lastname',
        image: null,
        firstname: 'firstname',
        id: 'user-1',
        lastLoginAt: new Date('2024-01-01'),
        lastname: 'lastname',
        role: 'USER',
        updatedAt: new Date('2024-01-01'),
        emailVerified: true,
        hasAccess: false,
        engaged: false,
        type: null,
      }
      prismaService.user.create = jest.fn().mockResolvedValue(mockUser)
      const result = await service.create(mockUser)
      expect(result).toEqual(mockUser)
    })
  })
})
