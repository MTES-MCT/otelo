import type { NextFunction, Request, Response } from 'express'

jest.mock('better-auth/api', () => ({ createAuthMiddleware: (fn: unknown) => fn }))

import { legacyOAuthCallbackPlugin, legacyOAuthCallbackRedirect } from './legacy-oauth-callback'

describe('legacyOAuthCallbackRedirect', () => {
  const middleware = legacyOAuthCallbackRedirect('api')

  const run = (method: string, originalUrl: string) => {
    const res = { redirect: jest.fn() } as unknown as Response
    const next = jest.fn() as NextFunction
    middleware({ method, originalUrl } as Request, res, next)
    return { next, redirect: res.redirect as jest.Mock }
  }

  it("renvoie l'ancien retour ProConnect vers la route 1.7 en gardant code et state", () => {
    const { next, redirect } = run('GET', '/api/auth/oauth2/callback/proconnect?code=abc&state=xyz')

    expect(redirect).toHaveBeenCalledWith(302, '/api/auth/callback/proconnect?code=abc&state=xyz')
    expect(next).not.toHaveBeenCalled()
  })

  it('laisse passer la nouvelle route', () => {
    const { next, redirect } = run('GET', '/api/auth/callback/proconnect?code=abc')

    expect(redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('ne touche ni aux autres méthodes ni aux identifiants invalides', () => {
    expect(run('POST', '/api/auth/oauth2/callback/proconnect').redirect).not.toHaveBeenCalled()
    expect(run('GET', '/api/auth/oauth2/callback/../admin').redirect).not.toHaveBeenCalled()
  })
})

describe('legacyOAuthCallbackPlugin', () => {
  const plugin = legacyOAuthCallbackPlugin(['proconnect'])
  type Providers = { id: string; callbackPath?: string }[]
  const init = (socialProviders: Providers) => (plugin.init as (ctx: unknown) => unknown)({ socialProviders })
  const beforeHook = (socialProviders: Providers) =>
    ((plugin.hooks?.before ?? [])[0].handler as unknown as (ctx: unknown) => Promise<unknown>)({ context: { socialProviders } })

  it("fait annoncer l'ancienne URL de retour au fournisseur nommé, sous le préfixe better-auth", () => {
    const providers: Providers = [{ id: 'proconnect' }, { id: 'google' }]
    init(providers)

    expect(providers).toEqual([{ id: 'proconnect', callbackPath: '/oauth2/callback/proconnect' }, { id: 'google' }])
  })

  it('couvre un fournisseur ajouté après le démarrage par une découverte différée', async () => {
    const providers: Providers = [{ id: 'proconnect' }]
    await beforeHook(providers)

    expect(providers[0].callbackPath).toBe('/oauth2/callback/proconnect')
  })
})
