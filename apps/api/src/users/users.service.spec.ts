import { createMock } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { UserType } from '~/generated/prisma/client'
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
          referent: true,
          firstname: true,
          hasAccess: true,
          id: true,
          image: true,
          lastLoginAt: true,
          lastname: true,
          name: true,
          region: true,
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
          referent: true,
          hasAccess: true,
          id: true,
          image: true,
          lastLoginAt: true,
          lastname: true,
          name: true,
          region: true,
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
          referent: true,
          emailVerified: true,
          engaged: true,
          firstname: true,
          hasAccess: true,
          id: true,
          image: true,
          lastLoginAt: true,
          lastname: true,
          name: true,
          region: true,
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

  describe('importUsersFromCsv', () => {
    const makeRow = (
      overrides?: Partial<{ email: string; referent: string; name: string; firstname: string; lastname: string; type: UserType }>,
    ) => ({
      email: 'new@example.com',
      name: 'Jean Dupont',
      firstname: 'Jean',
      lastname: 'Dupont',
      referent: 'Réf. DDT 75',
      type: undefined,
      ...overrides,
    })

    it('should create a new user with hasAccess true', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      const result = await service.importUsersFromCsv([makeRow()])

      expect(result).toEqual({ created: 1, skipped: 0 })
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'Jean Dupont',
          firstname: 'Jean',
          lastname: 'Dupont',
          referent: 'Réf. DDT 75',
          type: null,
          hasAccess: true,
          emailVerified: true,
        },
      })
    })

    it('should persist typologie when provided', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      await service.importUsersFromCsv([makeRow({ type: 'AgenceUrbanisme' })])

      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'AgenceUrbanisme' }),
        }),
      )
    })

    it('should skip existing users without modifying them', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({ id: 'existing-id' })

      const result = await service.importUsersFromCsv([makeRow()])

      expect(result).toEqual({ created: 0, skipped: 1 })
      expect(prismaService.user.create).not.toHaveBeenCalled()
    })

    it('should handle mixed rows (some existing, some new)', async () => {
      prismaService.user.findUnique = jest
        .fn()
        .mockResolvedValueOnce({ id: 'existing-id' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      const result = await service.importUsersFromCsv([
        makeRow({ email: 'existing@example.com' }),
        makeRow({ email: 'new1@example.com' }),
        makeRow({ email: 'new2@example.com' }),
      ])

      expect(result).toEqual({ created: 2, skipped: 1 })
      expect(prismaService.user.create).toHaveBeenCalledTimes(2)
    })

    it('should normalize email to lowercase and trim whitespace', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      await service.importUsersFromCsv([makeRow({ email: '  Admin@EXAMPLE.COM  ' })])

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      })
      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'admin@example.com' }),
        }),
      )
    })

    it('should set referent to null when empty or undefined', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      await service.importUsersFromCsv([makeRow({ referent: '' })])

      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referent: null }),
        }),
      )
    })

    it('should always set hasAccess to true for imported users', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      await service.importUsersFromCsv([makeRow(), makeRow({ email: 'other@example.com' })])

      for (const call of (prismaService.user.create as jest.Mock).mock.calls) {
        expect(call[0].data.hasAccess).toBe(true)
      }
    })

    it('should return { created: 0, skipped: 0 } for empty input', async () => {
      const result = await service.importUsersFromCsv([])

      expect(result).toEqual({ created: 0, skipped: 0 })
      expect(prismaService.user.findUnique).not.toHaveBeenCalled()
      expect(prismaService.user.create).not.toHaveBeenCalled()
    })

    it('should not set role or other sensitive fields from input', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaService.user.create = jest.fn().mockResolvedValue({})

      await service.importUsersFromCsv([makeRow()])

      const createCall = (prismaService.user.create as jest.Mock).mock.calls[0][0]
      expect(createCall.data).not.toHaveProperty('role')
      expect(createCall.data).not.toHaveProperty('banned')
      expect(createCall.data).not.toHaveProperty('id')
      expect(createCall.data).toHaveProperty('emailVerified', true)
    })
  })
})
