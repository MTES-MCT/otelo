// Le schéma ci-dessous lit `process.env` au chargement du module : en développement,
// dotenv doit donc l'avoir peuplé avant, d'où cet appel avant les imports. Seul endroit
// du code applicatif qui charge `.env`.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config')
}

import { z } from 'zod'

const isProduction = process.env.NODE_ENV === 'production'

const blankAsMissing = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === '' ? undefined : value), schema)

const required = () => z.string().min(1)

const optional = () => blankAsMissing(z.string().min(1).optional())

const withDefault = (fallback: string) => blankAsMissing(z.string().default(fallback))

const ZEnv = z.object({
  // Exécution
  NODE_ENV: withDefault('development'),
  PORT: blankAsMissing(z.coerce.number().int().positive().default(3000)),

  // Adresses
  BETTER_AUTH_URL: optional(),
  // Aucun repli en production : cette valeur est l'origine acceptée par CORS et par
  // better-auth. Se replier sur localhost donnerait une application qui démarre puis
  // refuse toutes les requêtes du navigateur, sans rien signaler.
  CLIENT_BASE_URL: isProduction ? required() : withDefault('http://localhost:3000'),

  // Secrets
  API_KEY_ENCRYPTION_SECRET: required(),
  BETTER_AUTH_SECRET: required(),
  DATABASE_URL: required(),

  // Envoi de courriels (Brevo)
  BREVO_API_KEY: required(),
  BREVO_API_URL: required(),
  BREVO_EMAIL_VERIFICATION_TEMPLATE_ID: required(),
  BREVO_IMPORT_USER_TEMPLATE_ID: required(),
  BREVO_PASSWORD_RESET_TEMPLATE_ID: required(),
  BREVO_TWO_FACTOR_TEMPLATE_ID: required(),
  EMAIL_RECEIVER_EMAIL: required(),
  EMAIL_SENDER_EMAIL: required(),
  EMAIL_SENDER_NAME: required(),
  // Hors production, l'envoi réel n'a lieu que sur demande explicite.
  EMAIL_ENABLED: withDefault('false'),

  // Identité (ProConnect)
  OAUTH_PROCONNECT_CLIENT_ID: required(),
  OAUTH_PROCONNECT_CLIENT_SECRET: required(),
  OAUTH_PROCONNECT_ISSUER: required(),

  // Démarches Simplifiées
  DEMARCHES_SIMPLIFIEES_DEMARCHE_ID: required(),
  DEMARCHES_SIMPLIFIEES_TOKEN: required(),
  DEMARCHES_SIMPLIFIEES_URL: required(),

  TRUSTED_PROXY_IPS: z.string(),

  // Réglages d'exploitation. Facultatifs : leur valeur par défaut est portée par le
  // module qui les consomme, avec l'explication qui va avec.
  PUPPETEER_EXECUTABLE_PATH: optional(),
  TWO_FACTOR_BYPASS_EMAILS: withDefault(''),
  EPCI_NEIGHBORS_ALLOWED_EMAILS: withDefault(''),

  // Sauvegardes Scalingo, lues par la ligne de commande uniquement.
  SCALINGO_ADDON_ID: optional(),
  SCALINGO_API_TOKEN: optional(),
  SCALINGO_APP_NAME: optional(),
  SCALINGO_DB_API_URL: optional(),
  SCALINGO_REGION: optional(),
})

export type Env = z.infer<typeof ZEnv>

const parseOrExplain = (source: Record<string, unknown>): Env => {
  const result = ZEnv.safeParse(source)
  if (result.success) {
    return result.data
  }

  const details = result.error.issues.map((issue) => `  - ${issue.path.join('.')} : ${issue.message}`).join('\n')

  throw new Error(`Configuration d'environnement invalide :\n${details}`)
}

export const env = parseOrExplain(process.env)
