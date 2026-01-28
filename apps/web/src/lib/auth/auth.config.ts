import type { AuthOptions, NextAuthOptions, Session, User } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { ProConnectProvider, proConnectProviderId } from '~/lib/auth/providers/pro-connect'

export type CustomUser = User & {
  firstname: string
  lastname: string
  sub: string
  hasAccess: boolean
  id: string
  email: string
  provider: string
  role: 'ADMIN' | 'USER'
  type?: 'DDT' | 'AgenceUrbanisme' | 'Collectivite' | 'DREAL' | 'BureauEtudes'
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    async signIn(params) {
      try {
        // We sign up user there
        if (params.account?.provider === proConnectProviderId) {
          const user = params.user as CustomUser
          await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/callback`, {
            body: JSON.stringify({
              email: user.email,
              provider: params.account?.provider,
              firstname: user.firstname,
              lastname: user.lastname,
              sub: user.sub,
              id: user.id,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })
        }

        const hasUserAccess = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/access`, {
          method: 'POST',
          body: JSON.stringify({
            email: params.user.email,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!hasUserAccess.ok) {
          throw new Error('Failed to check user access')
        }
        const data = await hasUserAccess.json()
        if (data) {
          return true
        }
        return false
      } catch {
        return false
      }
    },
    async jwt({ account, token, user, trigger }) {
      // Handle session update trigger (when update() is called -> in case we update the type)
      if (trigger === 'update' && token.accessToken && token.user) {
        try {
          const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/users/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token.accessToken}`,
            },
          })
          if (response.ok) {
            const updatedUser = await response.json()
            token.user = updatedUser
          }
        } catch (error) {
          console.error('Failed to fetch updated user data:', error)
        }
      }

      if (account) {
        // User is already registered in the signIn callback
        // Get session tokens
        try {
          const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/callback`, {
            body: JSON.stringify({
              email: user.email,
              provider: account.provider,
              firstname: (user as CustomUser).firstname,
              lastname: (user as CustomUser).lastname,
              sub: (user as CustomUser).sub,
              id: (user as CustomUser).id,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })
          if (!response.ok) {
            throw new Error('Failed to get tokens from API')
          }
          const data = await response.json()
          const expiresAtUnix = Math.floor(new Date(data.session.expiresAt).getTime() / 1000)
          token.accessToken = data.session.accessToken
          token.refreshToken = data.session.refreshToken
          token.expiresAt = expiresAtUnix
          token.user = data.user

          // User has passed the access check in signIn
          token.hasAccess = true
        } catch (_error) {
          throw new Error('Failed to get tokens from API')
        }
      } else if (Date.now() < (token.expiresAt as number) * 1000) {
        // Subsequent logins, but the `access_token` is still valid
        const hasUserAccess = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/access`, {
          method: 'POST',
          body: JSON.stringify({
            email: (token.user as CustomUser)?.email,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!hasUserAccess.ok) {
          token.error = 'AccessCheckError'
          throw new Error('Failed to check user access')
        }

        const accessData = await hasUserAccess.json()

        if (!accessData) {
          token.error = 'AccessRevoked'
          throw new Error('User access has been revoked')
        }
        return token
      } else {
        if (!token.refreshToken) throw new TypeError('Missing refresh_token')
        try {
          const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/refresh`, {
            headers: {
              Authorization: `Bearer ${token.refreshToken}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })
          if (!response.ok) {
            token.error = 'RefreshTokenError'
            throw new Error('Failed to refresh token')
          }

          const data = await response.json()

          // Check if user still has access after refresh
          const hasUserAccess = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/access`, {
            method: 'POST',
            body: JSON.stringify({
              email: (token.user as CustomUser)?.email,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!hasUserAccess.ok) {
            token.error = 'AccessCheckError'
            throw new Error('Failed to check user access')
          }

          const accessData = await hasUserAccess.json()
          if (!accessData) {
            token.error = 'AccessRevoked'
            throw new Error('User access has been revoked')
          }

          const expiresAtUnix = Math.floor(new Date(data.session.expiresAt).getTime() / 1000)
          token.accessToken = data.session.accessToken
          token.refreshToken = data.session.refreshToken
          token.expiresAt = expiresAtUnix
        } catch (error) {
          console.error('Error refreshing token:', error)
          token.error = 'RefreshTokenError'
          return token
        }
      }
      return token
    },
    async session({ session, token }) {
      ;(session as Session).accessToken = token.accessToken as string
      ;(session as Session).user = token.user as CustomUser
      ;(session as Session).error = (token.error as string) ?? null

      return session
    },
  },
  providers: [
    ProConnectProvider(),
    Credentials({
      name: 'Email - Mot de passe',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      authorize: async (credentials) => {
        const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/signin`, {
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message)
        }
        return data
      },
    }),
  ],
} satisfies AuthOptions
