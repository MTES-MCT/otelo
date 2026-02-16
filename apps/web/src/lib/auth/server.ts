import { cookies } from 'next/headers'

const API_URL = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api` || 'http://localhost:4200/api'

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

    const response = await fetch(`${API_URL}/auth/get-session`, {
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

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      cookie: cookieHeader,
      'Content-Type': 'application/json',
    },
  })
}
