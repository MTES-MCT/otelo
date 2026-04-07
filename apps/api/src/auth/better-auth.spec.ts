jest.unmock('~/auth/better-auth')

import { checkWhitelistBeforeCreate, updateLastLoginAt } from './better-auth'

jest.mock('better-auth', () => ({
  betterAuth: jest.fn().mockReturnValue({
    api: { getSession: jest.fn() },
    $Infer: { Session: {} },
  }),
}))
jest.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: jest.fn() }))
jest.mock('better-auth/plugins', () => ({ admin: jest.fn(), genericOAuth: jest.fn() }))
jest.mock('better-auth/plugins/admin/access', () => ({ adminAc: {}, userAc: {} }))
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn() }))
jest.mock('~/generated/prisma/client', () => ({ PrismaClient: jest.fn() }))

describe('better-auth hooks', () => {
  describe('checkWhitelistBeforeCreate', () => {
    const mockDb = {
      userWhitelist: { findUnique: jest.fn() },
      user: { update: jest.fn() },
    }

    beforeEach(() => jest.clearAllMocks())

    it('should set hasAccess to true when email is in whitelist', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue({ email: 'whitelisted@test.com' })

      const user = { email: 'whitelisted@test.com', name: 'Test', firstname: 'Test', lastname: 'User' }
      const result = await checkWhitelistBeforeCreate(mockDb, user)

      expect(result).toEqual({
        data: {
          ...user,
          hasAccess: true,
        },
      })
    })

    it('should return undefined (no modification) when email is NOT in whitelist', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue(null)

      const user = { email: 'unknown@test.com', name: 'Test', firstname: 'Test', lastname: 'User' }
      const result = await checkWhitelistBeforeCreate(mockDb, user)

      expect(result).toBeUndefined()
    })

    it('should preserve all original user fields when setting hasAccess', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue({ email: 'user@test.com' })

      const user = {
        email: 'user@test.com',
        name: 'Jean Dupont',
        firstname: 'Jean',
        lastname: 'Dupont',
        role: 'USER',
        engaged: false,
        hasAccess: false,
      }
      const result = await checkWhitelistBeforeCreate(mockDb, user)

      expect(result!.data).toMatchObject({
        email: 'user@test.com',
        name: 'Jean Dupont',
        firstname: 'Jean',
        lastname: 'Dupont',
        role: 'USER',
        engaged: false,
        hasAccess: true,
      })
    })

    it('should query whitelist with the exact email provided', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue(null)

      await checkWhitelistBeforeCreate(mockDb, { email: 'Specific@Email.com' })

      expect(mockDb.userWhitelist.findUnique).toHaveBeenCalledWith({
        where: { email: 'Specific@Email.com' },
      })
    })
  })

  describe('updateLastLoginAt', () => {
    const mockDb = {
      userWhitelist: { findUnique: jest.fn() },
      user: { update: jest.fn() },
    }

    beforeEach(() => jest.clearAllMocks())

    it('should update lastLoginAt for the session user', async () => {
      mockDb.user.update.mockResolvedValue({})

      await updateLastLoginAt(mockDb, { userId: 'user-123', token: 'abc' })

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLoginAt: expect.any(Date) },
      })
    })
  })
})
