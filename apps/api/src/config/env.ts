// Le schéma ci-dessous lit `process.env` au chargement du module : en développement,
// dotenv doit donc l'avoir peuplé avant. Placé en tête de fichier, avant les imports,
// comme dans `better-auth.ts` — même contrainte, même convention.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config')
}

import { z } from 'zod'

/**
 * `NODE_ENV` est la seule variable que l'application lit encore en direct.
 *
 * Elle sélectionne le mode de validation ci-dessous : elle ne peut donc pas passer par
 * lui. Deux suites de tests la basculent aussi en cours d'exécution pour éprouver un
 * comportement réservé à la production (`cron.service.spec.ts`), ce qu'un instantané
 * figé à l'import interdirait. Elle reste exposée par `env` pour `ConfigService`, mais
 * les gardes `=== 'production'` du code la lisent directement, et c'est voulu.
 */
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Traite une variable déclarée mais vide comme absente.
 *
 * `FOO=` dans un fichier d'environnement, ou une variable créée sans valeur sur la
 * plateforme d'hébergement, donne `''` et non `undefined`. Sans ce passage préalable,
 * `.default()` ne se déclenche pas — il ne réagit qu'à `undefined` — et la chaîne vide
 * se propage jusqu'au point d'usage, où elle produit des URL du type `/connexion`.
 */
const blankAsMissing = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === '' ? undefined : value), schema)

/** Exigée partout : son absence interrompt le démarrage. */
const required = () => blankAsMissing(z.string().min(1))

/** Facultative : son absence est un cas de fonctionnement normal. */
const optional = () => blankAsMissing(z.string().min(1).optional())

/**
 * Facultative, sans confusion entre « vide » et « absente ».
 *
 * Pour une variable qui porte une liste, la chaîne vide est une valeur à part entière :
 * elle déclare « aucune entrée », ce qui n'est pas « non renseignée, applique la valeur
 * par défaut ». `TRUSTED_PROXY_IPS=` sert précisément à n'accorder confiance à aucun
 * intermédiaire ; le confondre avec l'absence y rétablirait les valeurs par défaut.
 */
const optionalAllowingBlank = () => z.string().optional()

/** Facultative, avec une valeur de remplacement explicite. */
const withDefault = (fallback: string) => blankAsMissing(z.string().default(fallback))

/**
 * Exigée en production, repliée ailleurs.
 *
 * Réservé aux variables dont une valeur de développement a un sens évident. En
 * production, pas de repli : `CLIENT_BASE_URL` gouverne l'origine acceptée par CORS et
 * la liste des origines de confiance de better-auth ; un repli silencieux sur
 * `localhost` y donnerait une application qui démarre normalement puis refuse toutes
 * les requêtes du navigateur, panne d'autant plus longue à diagnostiquer qu'aucun
 * signal n'est émis au démarrage.
 */
const requiredInProduction = (devFallback: string) => (isProduction ? required() : withDefault(devFallback))

/**
 * L'inventaire complet des variables d'environnement de l'API.
 *
 * Tout ce que l'application lit passe par ici : il n'y a pas d'autre `process.env` dans
 * le code applicatif, `NODE_ENV` excepté (voir plus haut). Une variable qui n'y figure
 * pas n'existe pas pour l'application — c'est la propriété qui donne son intérêt au
 * fichier, et la raison de ne pas la contourner « juste pour une variable ».
 */
const ZEnv = z.object({
  // Exécution
  NODE_ENV: withDefault('development'),
  PORT: blankAsMissing(z.coerce.number().int().positive().default(3000)),

  // Adresses
  BETTER_AUTH_URL: optional(),
  CLIENT_BASE_URL: requiredInProduction('http://localhost:3000'),

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

  // Réglages d'exploitation. Facultatifs : leur valeur par défaut est portée par le
  // module qui les consomme, avec l'explication qui va avec.
  PUPPETEER_EXECUTABLE_PATH: optional(),
  TRUSTED_PROXY_IPS: optionalAllowingBlank(),
  TWO_FACTOR_BYPASS_EMAILS: withDefault(''),

  // Sauvegardes Scalingo, lues par la ligne de commande uniquement.
  SCALINGO_ADDON_ID: optional(),
  SCALINGO_API_TOKEN: optional(),
  SCALINGO_APP_NAME: optional(),
  SCALINGO_DB_API_URL: optional(),
  SCALINGO_REGION: optional(),
})

export type Env = z.infer<typeof ZEnv>

/**
 * Arrête le démarrage sur un message lisible plutôt que sur une trace Zod brute.
 *
 * Cette erreur survient au chargement du processus, souvent dans un journal de
 * plateforme que personne ne lit en entier : elle doit nommer les variables fautives
 * dès la première ligne.
 */
const parseOrExplain = (source: Record<string, unknown>): Env => {
  const result = ZEnv.safeParse(source)
  if (result.success) {
    return result.data
  }

  const details = result.error.issues.map((issue) => `  - ${issue.path.join('.')} : ${issue.message}`).join('\n')

  throw new Error(`Configuration d'environnement invalide :\n${details}`)
}

/**
 * Résolu une fois, au chargement du module.
 *
 * `better-auth.ts` construit son client à l'import, avant que Nest n'existe : il ne
 * peut pas recevoir `ConfigService`. `main.ts` configure CORS avant que l'application
 * n'écoute. Une valeur disponible dès l'import est donc nécessaire — et une fois
 * qu'elle l'est, la faire cohabiter avec `ConfigService` n'aurait servi qu'à entretenir
 * deux sources pour la même donnée.
 */
export const env = parseOrExplain(process.env)

/**
 * Alimente `ConfigService`, pour le code qui préfère l'injection à l'import.
 * La validation a déjà eu lieu : c'est le même objet.
 */
export const loadEnvConfig = (): Env => env
