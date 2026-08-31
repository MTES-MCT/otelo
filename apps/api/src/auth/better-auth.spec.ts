jest.unmock('~/auth/better-auth')

import { checkWhitelistBeforeCreate, recordLoginEvent, resolveLoginProvider, touchLoginEvent, updateLastLoginAt } from './better-auth'

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

  describe('resolveLoginProvider', () => {
    it.each([
      ['/oauth2/callback/proconnect', 'proconnect'],
      ['/callback/proconnect', 'proconnect'],
      ['/sign-in/email', 'credential'],
      ['/sign-up/email', 'credential'],
    ])('should resolve %s to %s', (path, expected) => {
      expect(resolveLoginProvider(path)).toBe(expected)
    })

    it.each([[undefined], [null], ['']])('should return null when the path is %s', (path) => {
      expect(resolveLoginProvider(path)).toBeNull()
    })

    it('should return null rather than guessing on an unknown path', () => {
      expect(resolveLoginProvider('/some/unrelated/endpoint')).toBeNull()
    })
  })

  describe('recordLoginEvent', () => {
    const mockDb = {
      user: { findUnique: jest.fn() },
      loginEvent: { create: jest.fn(), updateMany: jest.fn() },
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockDb.user.findUnique.mockResolvedValue({ region: 'Bretagne', type: 'DDT' })
      mockDb.loginEvent.create.mockResolvedValue({})
    })

    it('should snapshot the user type and region at login time', async () => {
      await recordLoginEvent(mockDb, { id: 'session-1', userId: 'user-123' }, '/sign-in/email')

      expect(mockDb.loginEvent.create).toHaveBeenCalledWith({
        data: {
          provider: 'credential',
          region: 'Bretagne',
          sessionId: 'session-1',
          userId: 'user-123',
          userType: 'DDT',
        },
      })
    })

    it('should NOT record impersonated sessions', async () => {
      await recordLoginEvent(mockDb, { id: 'session-1', impersonatedBy: 'admin-1', userId: 'user-123' }, '/sign-in/email')

      expect(mockDb.loginEvent.create).not.toHaveBeenCalled()
      expect(mockDb.user.findUnique).not.toHaveBeenCalled()
    })

    it('should skip when the session has no id', async () => {
      await recordLoginEvent(mockDb, { userId: 'user-123' }, '/sign-in/email')

      expect(mockDb.loginEvent.create).not.toHaveBeenCalled()
    })

    it('should record null snapshots when the user has no type nor region', async () => {
      mockDb.user.findUnique.mockResolvedValue({ region: null, type: null })

      await recordLoginEvent(mockDb, { id: 'session-1', userId: 'user-123' })

      expect(mockDb.loginEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ provider: null, region: null, userType: null }),
      })
    })

    it('should never throw when the insert fails, so a login is never blocked', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockDb.loginEvent.create.mockRejectedValue(new Error('db down'))

      await expect(recordLoginEvent(mockDb, { id: 'session-1', userId: 'user-123' })).resolves.toBeUndefined()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('touchLoginEvent', () => {
    const mockDb = {
      user: { findUnique: jest.fn() },
      loginEvent: { create: jest.fn(), updateMany: jest.fn() },
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockDb.loginEvent.updateMany.mockResolvedValue({ count: 1 })
    })

    it('should refresh lastSeenAt for the matching session', async () => {
      await touchLoginEvent(mockDb, { id: 'session-1', userId: 'user-123' })

      expect(mockDb.loginEvent.updateMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        data: { lastSeenAt: expect.any(Date) },
      })
    })

    it('should use updateMany so a session predating the feature does not throw', async () => {
      mockDb.loginEvent.updateMany.mockResolvedValue({ count: 0 })

      await expect(touchLoginEvent(mockDb, { id: 'unknown-session', userId: 'user-123' })).resolves.toBeUndefined()
    })

    it('should never throw when the update fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockDb.loginEvent.updateMany.mockRejectedValue(new Error('db down'))

      await expect(touchLoginEvent(mockDb, { id: 'session-1', userId: 'user-123' })).resolves.toBeUndefined()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })
})
