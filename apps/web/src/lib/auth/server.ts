import { cookies } from 'next/headers'

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

function buildHeaders(options: RequestInit, cookieHeader?: string): Headers {
  const headers = new Headers(options.headers)

  if (cookieHeader) {
    headers.set('cookie', cookieHeader)
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
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
  type?: 'DDT' | 'AgenceUrbanisme' | 'Collectivite' | 'DREAL' | 'BureauEtudes' | 'Autre' | null
  lastLoginAt?: string
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

    const response = await fetch(buildApiUrl('/auth/get-session'), {
      headers: {
        cookie: cookieHeader,
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

  return fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options, cookieHeader),
  })
}

export async function unauthFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options),
  })
}
