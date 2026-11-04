import type { NextFunction, Request, Response } from 'express'

/**
 * Chemin de retour ProConnect antérieur à better-auth 1.7.
 *
 * better-auth 1.7 sert les retours OAuth sur `/auth/callback/:id`, plus sur
 * `/auth/oauth2/callback/:id`. L'URL de retour déclarée chez ProConnect reste l'ancienne : on la
 * garde comme `redirectURI` du fournisseur, et on renvoie le navigateur vers la nouvelle route
 * en conservant `code` et `state`. La redirection, relative, reste sur l'hôte appelé — le site,
 * qui relaie `/api/auth/*` à l'API.
 */
export const legacyOAuthCallbackPath = (providerId: string) => `/auth/oauth2/callback/${providerId}`

export const legacyOAuthCallbackRedirect = (globalPrefix: string) => {
  const pattern = new RegExp(`^/${globalPrefix}/auth/oauth2/callback/([A-Za-z0-9_-]+)(\\?.*)?$`)

  return (req: Request, res: Response, next: NextFunction) => {
    const match = req.method === 'GET' ? pattern.exec(req.originalUrl) : null
    if (!match) {
      next()
      return
    }

    const [, providerId, query = ''] = match
    res.redirect(302, `/${globalPrefix}/auth/callback/${providerId}${query}`)
  }
}
