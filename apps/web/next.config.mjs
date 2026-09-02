import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Racine du monorepo, calculée depuis ce fichier (apps/web/next.config.mjs).
//
// Sans cette valeur explicite, Next 16.3 refuse d'utiliser `pnpm-workspace.yaml`
// comme racine dès que celle-ci ressemble au répertoire personnel de l'utilisateur.
// C'est le cas sur Scalingo, qui construit dans `/build/<uuid>` : Next se rabat alors
// sur `apps/web`, ne résout plus `next/package.json` (installé à la racine par pnpm)
// et écrit `standalone/server.js` au lieu de `standalone/apps/web/server.js`,
// attendu par le script `start`.

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const normalizeApiBaseUrl = (rawUrl) => {
  const trimmed = rawUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4200')

/**
 * Origine d'une URL de configuration, ou `null` si la variable est absente ou invalide.
 * Sert à n'ouvrir la CSP que vers les services réellement configurés.
 */
const originOf = (value) => {
  if (!value) {
    return null
  }
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const matomoOrigin = originOf(process.env.NEXT_PUBLIC_MATOMO_URL)

/**
 * Origines que le navigateur est autorisé à appeler, en plus du site lui-même.
 *
 * Les données transitent par les routes `/api/*` de Next : elles sont relatives, donc
 * déjà couvertes par `'self'`. Restent deux cas :
 * - `NEXT_PUBLIC_APP_URL`, adresse de base du client d'authentification (better-auth) ;
 * - `NEXT_PUBLIC_AUTH_API_URL`, aujourd'hui appelée uniquement côté serveur, listée par
 *   précaution pour qu'un futur appel depuis le navigateur ne soit pas bloqué.
 *
 * En production les deux valent l'origine du site : la liste est alors sans effet.
 * C'est en revanche indispensable dès que le site et l'API sont sur des domaines
 * distincts — sans quoi la connexion est bloquée par le navigateur.
 */
const apiOrigins = [...new Set([originOf(process.env.NEXT_PUBLIC_APP_URL), originOf(process.env.NEXT_PUBLIC_AUTH_API_URL)].filter(Boolean))]

/**
 * Politique de sécurité du contenu.
 *
 * `unsafe-inline` est nécessaire à deux endroits et n'est pas un oubli :
 * - `script-src` : Next injecte les données d'hydratation en ligne dans la page ;
 * - `style-src` : le DSFR et tss-react produisent des styles en ligne à l'exécution.
 * Les supprimer suppose de passer aux nonces, ce qui impose un rendu dynamique sur
 * toutes les pages — un coût réel pour un gain limité ici, aucun contenu tiers
 * n'étant injecté dans le HTML.
 *
 * `frame-ancestors 'none'` interdit l'affichage du site dans le cadre d'un autre site,
 * ce qui écarte le détournement de clic (clickjacking).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${matomoOrigin ? ` ${matomoOrigin}` : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // Tuiles CARTO pour les cartes, plus les images encodées dans la page.
  `img-src 'self' data: blob: https://*.basemaps.cartocdn.com${matomoOrigin ? ` ${matomoOrigin}` : ''}`,
  "font-src 'self' data:",
  // API Otelo, découpage administratif de l'État, et Matomo si configuré.
  ['connect-src', "'self'", 'https://geo.api.gouv.fr', ...apiOrigins, matomoOrigin]
    .filter(Boolean)
    .join(' '),
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // 6 mois, sous-domaines inclus. `preload` omis : l'inscription est difficile à défaire.
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  // Empêche le navigateur de deviner un type de contenu différent de celui annoncé.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Doublon volontaire de `frame-ancestors`, pour les navigateurs anciens.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Ne transmet l'URL complète qu'aux pages du site ; l'origine seule vers l'extérieur.
  // Évite qu'un token de lien de partage fuite dans le référent d'un lien sortant.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Otelo n'utilise aucun de ces capteurs : on les refuse explicitement.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shared'],
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${apiBaseUrl}/auth/:path*`,
      },
    ]
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    })
    return config
  },
}

export default nextConfig
