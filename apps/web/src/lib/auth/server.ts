import type { UserType } from '@shared'
import { cookies, headers } from 'next/headers'

const DEFAULT_API_ORIGIN = 'http://localhost:4200'

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export function resolveApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || DEFAULT_API_ORIGIN
  return normalizeApiBaseUrl(rawUrl)
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${resolveApiBaseUrl()}${normalizedPath}`
}

/**
 * Chaîne `X-Forwarded-For` reçue par ce serveur.
 *
 * Sans ce relais, l'API ne voit que l'adresse du conteneur web : tous les visiteurs
 * partagent alors un même compteur de débit sur l'ensemble des routes qui transitent
 * par ce fichier — formulaire de contact et exports compris. On retransmet la chaîne
 * telle quelle ; le routeur de la plateforme y ajoutera l'adresse de ce conteneur en
 * fin de chaîne, ce qui permet à l'API de remonter jusqu'au visiteur.
 *
 * `headers()` lève hors contexte de requête (rendu statique) : on renvoie alors `null`
 * plutôt que de faire échouer l'appel, la perte d'adresse étant moins grave qu'une
 * page en erreur.
 */
export async function getForwardedFor(): Promise<string | null> {
  try {
    return (await headers()).get('x-forwarded-for')
  } catch {
    return null
  }
}

function buildHeaders(options: RequestInit, cookieHeader?: string, forwardedFor?: string | null): Headers {
  const requestHeaders = new Headers(options.headers)

  if (cookieHeader) {
    requestHeaders.set('cookie', cookieHeader)
  }

  if (forwardedFor) {
    requestHeaders.set('x-forwarded-for', forwardedFor)
  }

  if (!requestHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  return requestHeaders
}

interface SessionUser {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
  firstname: string
  lastname: string
  role: 'ADMIN' | 'USER'
  hasAccess: boolean
  type?: UserType | null
  lastLoginAt?: string
  region?: string | null
}

export interface Session {
  session: {
    id: string
    userId: string
    token: string
    expiresAt: string
    impersonatedBy?: string | null
  }
  user: SessionUser
}

/**
 * Get the current session from the Better Auth backend
 * Uses HTTP-only cookies for authentication
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  try {
    const cookieHeader = cookieStore.toString()

    // Cette route n'utilise pas `buildHeaders` : l'en-tête d'adresse doit donc y être
    // ajouté séparément, sans quoi la route la plus appelée de toutes resterait sur un
    // compteur partagé.
    const forwardedFor = await getForwardedFor()

    const response = await fetch(buildApiUrl('/auth/get-session'), {
      headers: {
        cookie: cookieHeader,
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data as Session
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
}

/**
 * Get the cookie header for API calls
 * With Better Auth, we use session cookies instead of bearer tokens
 */
export async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.toString()
}

/**
 * Make an authenticated fetch call to the API
 * Automatically forwards session cookies
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const cookieHeader = await getCookieHeader()
  const forwardedFor = await getForwardedFor()

  return fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options, cookieHeader, forwardedFor),
  })
}

export async function unauthFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const forwardedFor = await getForwardedFor()

  return fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options, undefined, forwardedFor),
  })
}
