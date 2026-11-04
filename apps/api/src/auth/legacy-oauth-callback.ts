import type { BetterAuthPlugin } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import type { NextFunction, Request, Response } from 'express'

/**
 * Fait annoncer l'ancienne URL de retour aux fournisseurs nommés.
 *
 * better-auth compose la `redirect_uri` à chaque requête : `baseURL` (préfixe d'authentification
 * compris) suivi du `callbackPath` du fournisseur. C'est le calcul de la 1.6, au chemin près :
 * l'URL envoyée à ProConnect reste donc identique à celle d'avant la montée de version, que
 * `BETTER_AUTH_URL` soit défini ou déduit de la requête. Une `redirectURI` fixe l'emporterait sur
 * ce calcul et figerait une origine qui n'est pas forcément celle enregistrée.
 *
 * genericOAuth ne transmet pas `callbackPath` : on le pose sur les fournisseurs déjà construits,
 * et de nouveau avant chaque requête, pour couvrir ceux qu'une découverte OIDC différée ajoute
 * après le démarrage.
 */
export const legacyOAuthCallbackPlugin = (providerIds: string[]): BetterAuthPlugin => {
  const apply = (providers: { id: string; callbackPath?: string }[]) => {
    for (const provider of providers) {
      if (providerIds.includes(provider.id) && !provider.callbackPath) {
        provider.callbackPath = `/oauth2/callback/${provider.id}`
      }
    }
  }

  return {
    id: 'legacy-oauth-callback',
    init: (ctx) => {
      apply(ctx.socialProviders)
    },
    hooks: {
      before: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            apply(ctx.context.socialProviders)
          }),
        },
      ],
    },
  }
}

/**
 * better-auth 1.7 sert les retours OAuth sur `/auth/callback/:id`, plus sur
 * `/auth/oauth2/callback/:id`. L'URL de retour déclarée chez ProConnect reste l'ancienne (voir
 * `legacyOAuthCallbackPlugin`) : on renvoie le navigateur vers la nouvelle route en conservant
 * `code` et `state`. La redirection, relative, reste sur l'hôte appelé.
 */
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
