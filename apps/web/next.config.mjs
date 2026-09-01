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

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shared'],
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4200'}/api/auth/:path*`,
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
