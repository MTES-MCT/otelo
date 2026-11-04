import type { NextFunction, Request, Response } from 'express'
import { legacyOAuthCallbackRedirect } from './legacy-oauth-callback'

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
