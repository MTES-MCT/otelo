import 'server-only'
import { unauthFetch } from '~/lib/auth/server'

/**
 * Appel à l'API Nest avec la clé d'API du questionnaire AMF.
 *
 * La clé reste côté serveur : le navigateur passe par les route handlers `/api/amf/*`,
 * qui relaient la requête ici. `unauthFetch` transmet `X-Forwarded-For`, dont dépend
 * la limite de débit par visiteur côté API.
 */
export async function amfFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const apiKey = process.env.AMF_API_KEY
  if (!apiKey) {
    throw new Error('AMF_API_KEY est absente : le questionnaire AMF ne peut pas joindre l’API.')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${apiKey}`)

  return unauthFetch(path, { ...init, headers, cache: 'no-store' })
}

/**
 * Relaie la réponse de l'API telle quelle (statut et corps), sans en-têtes amont.
 */
export async function relayAmfResponse(res: Response): Promise<Response> {
  if (res.status === 204) {
    return new Response(null, { status: 204 })
  }

  const body = await res.text()
  return new Response(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  })
}

export function amfProxyError(error: unknown): Response {
  console.error('Questionnaire AMF : appel à l’API impossible :', error instanceof Error ? error.message : error)
  return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 })
}
