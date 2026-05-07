import { adminClient, genericOAuthClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { nextCookies } from 'better-auth/next-js'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
    genericOAuthClient(),
    inferAdditionalFields({
      user: {
        firstname: { type: 'string', required: true },
        lastname: { type: 'string', required: true },
        type: { type: 'string', required: false },
        hasAccess: { type: 'boolean', required: true },
        role: { type: 'string', required: false },
        region: { type: 'string', required: false },
      },
    }),
    nextCookies(),
  ],
})

export const { signIn, signUp, signOut, getSession, useSession, resetPassword, sendVerificationEmail } = authClient

export { authClient as auth }
