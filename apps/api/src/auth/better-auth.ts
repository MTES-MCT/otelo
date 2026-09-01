// for dev purpose
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config')
}

import { PrismaPg } from '@prisma/adapter-pg'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { createAuthMiddleware } from 'better-auth/api'
import { generateRandomString, symmetricEncrypt } from 'better-auth/crypto'
import { admin, genericOAuth, twoFactor } from 'better-auth/plugins'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import { type Prisma, PrismaClient } from '~/generated/prisma/client'
import type { UserType } from '~/generated/prisma/enums'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

const PROCONNECT_ISSUER = process.env.OAUTH_PROCONNECT_ISSUER || ''

export async function sendBrevoTemplatedEmail(templateId: string, params: Record<string, string>, to: string, subject: string) {
  // Guard: never send real emails outside production unless explicitly opted in.
  // Set EMAIL_ENABLED=true to force real sending in dev (e.g. to test a template).
  if (process.env.NODE_ENV !== 'production' && process.env.EMAIL_ENABLED !== 'true') {
    console.log(`[Brevo:skipped] templateId=${templateId} to=${to} subject="${subject}" params=${JSON.stringify(params)}`)
    return
  }

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

export async function sendTwoFactorCode(
  db: {
    user: {
      findUnique: (args: {
        where: { id: string }
        select: { hasAccess: true; role: true }
      }) => Promise<{ hasAccess: boolean; role: string } | null>
    }
  },
  user: { id: string; email: string; name?: string | null },
  otp: string,
) {
  /**
   * Dernier verrou avant l'envoi : un compte en attente de validation ne reçoit rien.
   *
   * Le drapeau `twoFactorEnabled` suffit pour le parcours normal, mais `/two-factor/send-otp`
   * accepte aussi les requêtes portant une session ouverte — le chemin prévu pour activer
   * la double authentification depuis son compte. Un compte non validé, qui obtient bien
   * une session (sans aucun droit), pouvait donc déclencher l'envoi en appelant l'endpoint
   * directement. Constaté à l'exécution, pas supposé.
   *
   * Le contrôle est refait ici, au plus près de l'envoi, parce que c'est le seul endroit
   * que tous les chemins d'appel traversent.
   */
  const account = await db.user.findUnique({ where: { id: user.id }, select: { hasAccess: true, role: true } })
  if (!account || (!account.hasAccess && account.role !== 'ADMIN')) {
    console.warn(`[two-factor] Code non envoyé : le compte ${user.email} n'a pas encore accès à Otelo`)
    return
  }

  const baseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/connexion/double-authentification?code=${encodeURIComponent(otp)}`

  await sendBrevoTemplatedEmail(
    process.env.BREVO_TWO_FACTOR_TEMPLATE_ID!,
    {
      code: otp,
      firstname: user.name?.split(' ')[0] || '',
      resetPasswordUrl: `${baseUrl}/mot-de-passe-oublie`,
      verificationUrl,
    },
    user.email,
    'Votre code de connexion Otelo',
  )
}

type TwoFactorUser = { id: string; hasAccess: boolean; role: string; twoFactorEnabled: boolean }

type TwoFactorPrismaLike = {
  user: {
    findUnique: (args: {
      where: { email: string }
      select: { id: true; hasAccess: true; role: true; twoFactorEnabled: true }
    }) => Promise<TwoFactorUser | null>
    update: (args: { where: { id: string }; data: { twoFactorEnabled: boolean } }) => Promise<unknown>
  }
  twoFactor: {
    findFirst: (args: { where: { userId: string } }) => Promise<unknown>
    create: (args: { data: { secret: string; backupCodes: string; userId: string } }) => Promise<unknown>
  }
}

/**
 * Prépare la seconde authentification d'un compte, juste avant sa connexion.
 *
 * Fait deux choses, volontairement au même endroit puisqu'elles partagent la lecture
 * du compte.
 *
 * 1. **Aligne `twoFactorEnabled` sur le droit d'accès.** Un compte qui n'a pas encore
 *    été validé (Démarches Simplifiées ou administrateur) ne doit pas recevoir de code :
 *    il ne pourra de toute façon rien faire de sa session, et l'e-mail ne ferait
 *    qu'égarer une personne dont la demande est simplement en attente. En laissant le
 *    drapeau à faux, l'étape de vérification ne se déclenche pas et le site l'oriente
 *    vers la page d'accès non autorisé, qui porte l'acte d'engagement à télécharger.
 *    Les administrateurs gardent l'accès même sans `hasAccess`, comme ailleurs dans
 *    l'application.
 *
 *    Le contrôle vit ici plutôt qu'en amont de la vérification du mot de passe : refuser
 *    avant révélerait, à qui saisit une adresse au hasard, si le compte existe et où il
 *    en est de sa validation.
 *
 * 2. **Crée la ligne exigée par le plugin.** `/two-factor/verify-otp` refuse la
 *    vérification avec `TWO_FACTOR_NOT_ENABLED` si le compte n'a pas de ligne dans cette
 *    table — y compris pour le code envoyé par e-mail, qui pourtant ne s'en sert pas.
 *    La créer à la volée, plutôt que par un rattrapage en base, couvre d'un seul geste
 *    les comptes existants et les comptes à venir.
 *
 *    Le secret est aléatoire et chiffré : Otelo ne propose pas d'application
 *    d'authentification, il n'est donc jamais lu. Les codes de secours sont une liste
 *    vide, ce qui rend `/two-factor/verify-backup-code` inopérant par construction
 *    plutôt que de laisser traîner des codes valables que personne n'a reçus.
 *
 * N'échoue jamais bruyamment : une erreur ici ne doit pas empêcher la connexion de
 * s'engager, l'étape de vérification signalera le problème.
 */
export async function prepareTwoFactorForSignIn(db: TwoFactorPrismaLike, email: string, secret: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { hasAccess: true, id: true, role: true, twoFactorEnabled: true },
    })
    if (!user) {
      return
    }

    const shouldRequireTwoFactor = user.hasAccess || user.role === 'ADMIN'

    if (user.twoFactorEnabled !== shouldRequireTwoFactor) {
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: shouldRequireTwoFactor },
      })
    }

    if (!shouldRequireTwoFactor) {
      return
    }

    const existing = await db.twoFactor.findFirst({ where: { userId: user.id } })
    if (existing) {
      return
    }

    await db.twoFactor.create({
      data: {
        backupCodes: '[]',
        secret: await symmetricEncrypt({ data: generateRandomString(32), key: secret }),
        userId: user.id,
      },
    })
  } catch (error) {
    console.error('[two-factor] Failed to prepare two-factor sign-in', error)
  }
}

type PrismaLike = {
  userWhitelist: { findUnique: (args: { where: { email: string } }) => Promise<unknown> }
  user: { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> }
}

type LoginEventPrismaLike = {
  user: {
    findUnique: (args: {
      where: { id: string }
      select: Prisma.UserSelect
    }) => Promise<{ region?: string | null; type?: UserType | null } | null>
  }
  loginEvent: {
    create: (args: { data: Prisma.LoginEventUncheckedCreateInput }) => Promise<unknown>
    updateMany: (args: { where: Prisma.LoginEventWhereInput; data: Prisma.LoginEventUpdateManyMutationInput }) => Promise<unknown>
  }
}

type SessionLike = {
  id?: string
  userId: string
  impersonatedBy?: string | null
  [key: string]: unknown
}

/**
 * Prépare un compte à sa création : double authentification active, et accès immédiat
 * si l'adresse figure sur la liste blanche.
 *
 * `twoFactorEnabled` est posé ici et non par un défaut de schéma : better-auth écrit
 * explicitement la valeur déclarée par son plugin (`false`) au moment de l'insertion,
 * ce qui court-circuite le défaut de la base. Sans ce hook, tout compte créé
 * naîtrait sans seconde authentification — vérifié à l'exécution, pas déduit.
 */
export async function prepareUserBeforeCreate(db: PrismaLike, user: { email: string; [key: string]: unknown }) {
  const whitelist = await db.userWhitelist.findUnique({
    where: { email: user.email },
  })

  return {
    data: {
      ...user,
      twoFactorEnabled: true,
      ...(whitelist ? { hasAccess: true } : {}),
    },
  }
}

export async function updateLastLoginAt(db: PrismaLike, session: { userId: string; [key: string]: unknown }) {
  await db.user.update({
    where: { id: session.userId },
    data: { lastLoginAt: new Date() },
  })
}

/**
 * Déduit la méthode de connexion du chemin d'appel better-auth.
 *
 * Renvoie `null` plutôt qu'une valeur par défaut : le contexte n'est pas garanti présent
 * dans les hooks de base, et compter une connexion ProConnect comme « mot de passe »
 * fausserait le suivi d'adoption de ProConnect.
 */
export function resolveLoginProvider(path?: string | null): string | null {
  if (!path) {
    return null
  }

  if (path.includes('oauth2') || path.includes('callback') || path.includes('proconnect')) {
    return 'proconnect'
  }

  if (path.includes('sign-in') || path.includes('sign-up')) {
    return 'credential'
  }

  return null
}

/**
 * Journalise une connexion dans `login_events`.
 *
 * Les sessions d'usurpation ne sont pas journalisées : un administrateur naviguant
 * « en tant que » un utilisateur ne doit pas gonfler ses statistiques d'usage.
 *
 * `type` et `region` sont copiés au moment de la connexion : ce sont des champs mutables
 * de `users`, une jointure ultérieure réécrirait rétroactivement l'historique.
 *
 * N'échoue jamais : le suivi d'usage ne doit pas pouvoir empêcher une connexion.
 */
export async function recordLoginEvent(db: LoginEventPrismaLike, session: SessionLike, path?: string | null) {
  if (session.impersonatedBy || !session.id) {
    return
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { region: true, type: true },
    })

    await db.loginEvent.create({
      data: {
        provider: resolveLoginProvider(path),
        region: user?.region ?? null,
        sessionId: session.id,
        userId: session.userId,
        userType: user?.type ?? null,
      },
    })
  } catch (error) {
    console.error('[login-events] Failed to record login event', error)
  }
}

/**
 * Rafraîchit `lastSeenAt` au renouvellement de session (au-delà de `updateAge`),
 * ce qui donne un heartbeat serveur sans aucun code client.
 *
 * `updateMany` plutôt que `update` : les sessions ouvertes avant la mise en place
 * de `login_events` n'ont pas de ligne correspondante, et leur renouvellement ne
 * doit pas lever d'erreur.
 */
export async function touchLoginEvent(db: LoginEventPrismaLike, session: SessionLike) {
  if (!session.id) {
    return
  }

  try {
    await db.loginEvent.updateMany({
      where: { sessionId: session.id },
      data: { lastSeenAt: new Date() },
    })
  } catch (error) {
    console.error('[login-events] Failed to refresh login event', error)
  }
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
      const account = await prisma.account.findFirst({
        where: { userId: user.id, providerId: 'credential' },
      })

      if (!account) {
        const urlWithEmail = `${url}&email=${encodeURIComponent(user.email)}`
        await sendBrevoTemplatedEmail(
          process.env.BREVO_IMPORT_USER_TEMPLATE_ID!,
          { resetUrl: urlWithEmail, email: user.email },
          user.email,
          'Bienvenue sur Otelo - Créez votre mot de passe',
        )
      } else {
        await sendBrevoTemplatedEmail(
          process.env.BREVO_PASSWORD_RESET_TEMPLATE_ID!,
          { resetUrl: url },
          user.email,
          'Réinitialisation de votre mot de passe Otelo',
        )
      }
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
      allowImpersonatingAdmins: true,
      roles: {
        ADMIN: adminAc,
        USER: userAc,
      },
    }),
    /**
     * Double authentification sur la connexion par mot de passe.
     *
     * Le plugin ne s'active que sur `/sign-in/email`, `/sign-in/username` et
     * `/sign-in/phone-number` : ProConnect n'est pas concerné, sans réglage
     * particulier. La session créée par la vérification du mot de passe est
     * supprimée, et n'est recréée qu'après la saisie du code.
     *
     * `totpOptions.disable` : Otelo ne propose pas d'application d'authentification.
     * Sans cela, better-auth interrogerait la table des secrets à chaque connexion
     * pour un résultat toujours vide.
     *
     * `storeOTP: 'hashed'` : le code n'est jamais stocké en clair. Une lecture de la
     * base ne permet donc pas de terminer une connexion en cours.
     *
     * Le cookie d'attente (15 min) survit volontairement au code (10 min) : une
     * personne qui laisse expirer son code doit pouvoir en redemander un sans
     * ressaisir son mot de passe.
     */
    twoFactor({
      issuer: 'Otelo',
      twoFactorCookieMaxAge: 60 * 15,
      totpOptions: {
        disable: true,
      },
      otpOptions: {
        digits: 6,
        period: 10,
        storeOTP: 'hashed',
        sendOTP: async ({ user, otp }) => {
          await sendTwoFactorCode(prisma, user, otp)
        },
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
      region: {
        type: 'string',
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

  /**
   * Limitation de débit sur les routes d'authentification.
   *
   * `storage: 'database'` plutôt que la mémoire (défaut) : les compteurs doivent être
   * partagés entre conteneurs et survivre à un redémarrage. Avec un stockage mémoire,
   * il suffit d'attendre un redéploiement — ou de viser un autre conteneur — pour
   * repartir de zéro.
   *
   * Activée aussi hors production, sinon la règle n'est jamais exercée avant la mise
   * en ligne : les plafonds sont assez hauts pour ne pas gêner le développement.
   */
  rateLimit: {
    enabled: true,
    storage: 'database',
    // Plafond général : 100 appels par minute et par IP sur /api/auth/*.
    // Large, car le client interroge la session à chaque navigation.
    window: 60,
    max: 100,
    customRules: {
      // Connexion par mot de passe : 5 essais par minute. Une personne qui se trompe
      // deux fois n'est pas gênée ; un robot est arrêté net.
      '/sign-in/email': { window: 60, max: 5 },
      // Création de compte : limite l'inscription en masse d'adresses jetables.
      '/sign-up/email': { window: 60, max: 3 },
      // Envois d'e-mails : chaque appel déclenche un envoi réel via Brevo. Sans plafond,
      // l'endpoint sert d'outil de harcèlement par e-mail contre une adresse tierce.
      '/forget-password': { window: 300, max: 3 },
      '/send-verification-email': { window: 300, max: 3 },
      // Départ du parcours ProConnect : pas de secret à deviner ici, mais inutile
      // d'autoriser des milliers de redirections.
      '/sign-in/oauth2': { window: 60, max: 10 },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['proconnect'],
    },
  },
  /**
   * Prépare la seconde authentification avant que le mot de passe ne soit vérifié.
   *
   * Placé en amont plutôt qu'en aval : le plugin bascule vers l'étape de vérification
   * dans son propre hook de sortie, la ligne doit donc déjà exister à ce moment-là.
   */
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') {
        return
      }

      const email = (ctx.body as { email?: string } | undefined)?.email
      if (email) {
        await prepareTwoFactorForSignIn(prisma, email, process.env.BETTER_AUTH_SECRET || '')
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        before: (user) => prepareUserBeforeCreate(prisma, user),
      },
    },
    session: {
      create: {
        after: async (session, context) => {
          await updateLastLoginAt(prisma, session)
          await recordLoginEvent(prisma, session, context?.path)
        },
      },
      update: {
        // Better-auth renouvelle la session au-delà de `updateAge` (15 min) : ce hook
        // fournit donc un heartbeat serveur sans aucun code client ni endpoint de ping.
        after: (session) => touchLoginEvent(prisma, session),
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
