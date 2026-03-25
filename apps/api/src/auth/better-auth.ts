// for dev purpose
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config')
}

import { PrismaPg } from '@prisma/adapter-pg'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, genericOAuth } from 'better-auth/plugins'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import { PrismaClient } from '~/generated/prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

const PROCONNECT_ISSUER = process.env.OAUTH_PROCONNECT_ISSUER || ''

async function sendBrevoTemplatedEmail(templateId: string, params: Record<string, string>, to: string, subject: string) {
  const response = await fetch(process.env.BREVO_API_URL!, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      templateId: parseInt(templateId, 10),
      params,
      subject,
      to: [{ email: to }],
    }),
  })

  if (!response.ok) {
    console.error(`[Brevo] Failed to send email to ${to}:`, await response.text())
  }
}

type PrismaLike = {
  userWhitelist: { findUnique: (args: { where: { email: string } }) => Promise<unknown> }
  user: { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> }
}

export async function checkWhitelistBeforeCreate(db: PrismaLike, user: { email: string; [key: string]: unknown }) {
  const whitelist = await db.userWhitelist.findUnique({
    where: { email: user.email },
  })
  if (whitelist) {
    return {
      data: {
        ...user,
        hasAccess: true,
      },
    }
  }
}

export async function updateLastLoginAt(db: PrismaLike, session: { userId: string; [key: string]: unknown }) {
  await db.user.update({
    where: { id: session.userId },
    data: { lastLoginAt: new Date() },
  })
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [process.env.CLIENT_BASE_URL || 'http://localhost:3000'],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendBrevoTemplatedEmail(
        process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID!,
        { resetUrl: url },
        user.email,
        'Réinitialisation de votre mot de passe Otelo',
      )
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendBrevoTemplatedEmail(
        process.env.BREVO_EMAIL_VERIFICATION_TEMPLATE_ID!,
        { firstname: user.name?.split(' ')[0] || '', confirmationUrl: url },
        user.email,
        'Vérification de votre inscription sur Otelo',
      )
    },
    sendOnSignUp: true,
  },

  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultRole: 'USER',
      adminRoles: ['ADMIN'],
      roles: {
        ADMIN: adminAc,
        USER: userAc,
      },
    }),
    genericOAuth({
      config: [
        {
          providerId: 'proconnect',
          discoveryUrl: `${PROCONNECT_ISSUER}/api/v2/.well-known/openid-configuration`,
          clientId: process.env.OAUTH_PROCONNECT_CLIENT_ID || '',
          clientSecret: process.env.OAUTH_PROCONNECT_CLIENT_SECRET || '',
          scopes: ['openid', 'given_name', 'usual_name', 'email'],
          pkce: true,
          getUserInfo: async ({ accessToken }) => {
            // ProConnect returns a JWT in userinfo endpoint
            const res = await fetch(`${PROCONNECT_ISSUER}/api/v2/userinfo`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            const jwt = await res.text()
            // Decode JWT payload (second part)
            const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
            return {
              id: payload.sub,
              email: payload.email?.toLowerCase(),
              name: `${payload.given_name || ''} ${payload.usual_name || ''}`.trim(),
              emailVerified: true,
              firstname: payload.given_name,
              lastname: payload.usual_name,
            }
          },
        },
      ],
    }),
  ],
  user: {
    additionalFields: {
      firstname: {
        type: 'string',
        required: true,
        input: true,
      },
      lastname: {
        type: 'string',
        required: true,
        input: true,
      },
      hasAccess: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      engaged: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      type: {
        type: 'string',
        required: false,
        input: true,
      },
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false,
      },
      lastLoginAt: {
        type: 'date',
        required: false,
        input: false,
      },
    },
    changeEmail: {
      enabled: false,
    },
  },
  session: {
    expiresIn: 60 * 60, // 1 hour
    updateAge: 60 * 15, // Refresh session after 15 minutes of activity
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['proconnect'],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: (user) => checkWhitelistBeforeCreate(prisma, user),
      },
    },
    session: {
      create: {
        after: (session) => updateLastLoginAt(prisma, session),
      },
    },
  },
  advanced: {
    cookiePrefix: 'otelo',
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === 'production',
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
