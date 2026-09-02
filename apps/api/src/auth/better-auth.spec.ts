jest.unmock('~/auth/better-auth')

import {
  prepareTwoFactorForSignIn,
  prepareUserBeforeCreate,
  recordLoginEvent,
  resolveLoginProvider,
  sendTwoFactorCode,
  touchLoginEvent,
  updateLastLoginAt,
} from './better-auth'

jest.mock('better-auth', () => ({
  betterAuth: jest.fn().mockReturnValue({
    api: { getSession: jest.fn() },
    $Infer: { Session: {} },
  }),
}))
jest.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: jest.fn() }))
jest.mock('better-auth/api', () => ({ createAuthMiddleware: (fn: unknown) => fn }))
jest.mock('better-auth/crypto', () => ({
  generateRandomString: jest.fn(() => 'secret-aleatoire'),
  symmetricEncrypt: jest.fn(async ({ data }: { data: string }) => `chiffre(${data})`),
}))
jest.mock('better-auth/plugins', () => ({ admin: jest.fn(), genericOAuth: jest.fn(), twoFactor: jest.fn() }))
jest.mock('better-auth/plugins/admin/access', () => ({ adminAc: {}, userAc: {} }))
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn() }))
jest.mock('~/generated/prisma/client', () => ({ PrismaClient: jest.fn() }))

describe('better-auth hooks', () => {
  describe('sendTwoFactorCode', () => {
    const user = { email: 'agent@test.com', id: 'user-1' }
    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      jest.clearAllMocks()
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, text: async () => '' } as Response)
    })

    afterEach(() => {
      fetchSpy.mockRestore()
    })

    const dbWith = (account: unknown) => ({ user: { findUnique: jest.fn().mockResolvedValue(account) } })

    it('should send the link and the code to an account with access', async () => {
      await sendTwoFactorCode(dbWith({ firstname: 'Camille', hasAccess: true, role: 'USER' }), user, '482917')

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.params).toEqual({
        code: '482917',
        firstname: 'Camille',
        // Seul chemin de changement de mot de passe accessible à quelqu'un à qui l'on
        // demande justement de ne pas terminer sa connexion.
        resetPasswordUrl: 'https://otelo.test/mot-de-passe-oublie',
        verificationUrl: 'https://otelo.test/connexion/double-authentification?code=482917',
      })
    })

    /**
     * Le prénom vient de la colonne `firstname`, pas d'un découpage de `name` sur la
     * première espace : ce découpage amputait « Marie Claire » en « Marie », et se
     * trompait complètement pour les comptes ProConnect, où `name` concatène le prénom
     * et le nom d'usage.
     */
    it('should take the first name from the model, spaces included', async () => {
      await sendTwoFactorCode(dbWith({ firstname: 'Marie Claire', hasAccess: true, role: 'USER' }), user, '482917')

      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.params.firstname).toBe('Marie Claire')
    })

    // `/two-factor/send-otp` accepte aussi les requêtes portant une session ouverte :
    // un compte non validé, qui en obtient une sans aucun droit, pouvait déclencher
    // l'envoi en appelant l'endpoint directement.
    it('should send nothing to an account still awaiting validation', async () => {
      await sendTwoFactorCode(dbWith({ firstname: 'Camille', hasAccess: false, role: 'USER' }), user, '482917')

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should send to an admin even without hasAccess', async () => {
      await sendTwoFactorCode(dbWith({ firstname: 'Camille', hasAccess: false, role: 'ADMIN' }), user, '482917')

      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('should send nothing when the account no longer exists', async () => {
      await sendTwoFactorCode(dbWith(null), user, '482917')

      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('prepareTwoFactorForSignIn', () => {
    const mockDb = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      twoFactor: { findFirst: jest.fn(), create: jest.fn() },
    }

    const granted = { hasAccess: true, id: 'user-1', role: 'USER', twoFactorEnabled: true }

    beforeEach(() => jest.clearAllMocks())

    it('should create the record when the account has none', async () => {
      mockDb.user.findUnique.mockResolvedValue(granted)
      mockDb.twoFactor.findFirst.mockResolvedValue(null)

      await prepareTwoFactorForSignIn(mockDb, 'agent@test.com', 'secret-app')

      expect(mockDb.twoFactor.create).toHaveBeenCalledWith({
        data: {
          // Liste vide : `/two-factor/verify-backup-code` ne peut jamais aboutir.
          backupCodes: '[]',
          secret: 'chiffre(secret-aleatoire)',
          userId: 'user-1',
        },
      })
    })

    it('should not duplicate an existing record', async () => {
      mockDb.user.findUnique.mockResolvedValue(granted)
      mockDb.twoFactor.findFirst.mockResolvedValue({ id: 'tf-1' })

      await prepareTwoFactorForSignIn(mockDb, 'agent@test.com', 'secret-app')

      expect(mockDb.twoFactor.create).not.toHaveBeenCalled()
    })

    it('should do nothing for an unknown email', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      await prepareTwoFactorForSignIn(mockDb, 'inconnu@test.com', 'secret-app')

      expect(mockDb.twoFactor.findFirst).not.toHaveBeenCalled()
      expect(mockDb.twoFactor.create).not.toHaveBeenCalled()
    })

    // Un compte en attente de validation ne doit recevoir aucun code : il serait
    // orienté vers la page d'accès non autorisé de toute façon.
    it('should disable two-factor for an account still awaiting validation', async () => {
      mockDb.user.findUnique.mockResolvedValue({ hasAccess: false, id: 'user-2', role: 'USER', twoFactorEnabled: true })

      await prepareTwoFactorForSignIn(mockDb, 'en-attente@test.com', 'secret-app')

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { twoFactorEnabled: false },
      })
      expect(mockDb.twoFactor.create).not.toHaveBeenCalled()
    })

    // Les administrateurs entrent sans `hasAccess`, ici comme ailleurs : ils doivent
    // donc bien passer par la seconde étape.
    it('should keep two-factor for an admin without hasAccess', async () => {
      mockDb.user.findUnique.mockResolvedValue({ hasAccess: false, id: 'user-3', role: 'ADMIN', twoFactorEnabled: false })
      mockDb.twoFactor.findFirst.mockResolvedValue(null)

      await prepareTwoFactorForSignIn(mockDb, 'admin@test.com', 'secret-app')

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-3' },
        data: { twoFactorEnabled: true },
      })
      expect(mockDb.twoFactor.create).toHaveBeenCalled()
    })

    // Une connexion sur deux ne doit pas écrire en base pour rien.
    it('should not write when the flag already matches', async () => {
      mockDb.user.findUnique.mockResolvedValue(granted)
      mockDb.twoFactor.findFirst.mockResolvedValue({ id: 'tf-1' })

      await prepareTwoFactorForSignIn(mockDb, 'agent@test.com', 'secret-app')

      expect(mockDb.user.update).not.toHaveBeenCalled()
    })

    // La préparation de la seconde étape ne doit jamais faire échouer la connexion
    // elle-même : l'étape de vérification signalera le problème.
    it('should swallow database errors', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('base indisponible'))

      await expect(prepareTwoFactorForSignIn(mockDb, 'agent@test.com', 'secret-app')).resolves.toBeUndefined()
    })
  })

  describe('prepareUserBeforeCreate', () => {
    const mockDb = {
      userWhitelist: { findUnique: jest.fn() },
      user: { update: jest.fn() },
    }

    beforeEach(() => jest.clearAllMocks())

    it('should set hasAccess to true when email is in whitelist', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue({ email: 'whitelisted@test.com' })

      const user = { email: 'whitelisted@test.com', name: 'Test', firstname: 'Test', lastname: 'User' }
      const result = await prepareUserBeforeCreate(mockDb, user)

      expect(result).toEqual({
        data: {
          ...user,
          hasAccess: true,
          twoFactorEnabled: true,
        },
      })
    })

    it('should not grant access when email is NOT in whitelist', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue(null)

      const user = { email: 'unknown@test.com', name: 'Test', firstname: 'Test', lastname: 'User' }
      const result = await prepareUserBeforeCreate(mockDb, user)

      expect(result?.data).not.toHaveProperty('hasAccess')
    })

    // Le plugin de double authentification déclare `twoFactorEnabled: false` par défaut
    // et better-auth écrit cette valeur à l'insertion, écrasant le défaut de la base.
    // Sans ce hook, tout compte naîtrait sans seconde authentification.
    it('should enable two-factor authentication on every new account', async () => {
      mockDb.userWhitelist.findUnique.mockResolvedValue(null)

      const user = { email: 'unknown@test.com', name: 'Test', firstname: 'Test', lastname: 'User' }
      const result = await prepareUserBeforeCreate(mockDb, user)

      expect(result?.data.twoFactorEnabled).toBe(true)
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
      const result = await prepareUserBeforeCreate(mockDb, user)

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

      await prepareUserBeforeCreate(mockDb, { email: 'Specific@Email.com' })

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
