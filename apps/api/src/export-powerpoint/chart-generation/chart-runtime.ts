import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/**
 * Bundle Chart.js lu depuis les dépendances du projet, et non depuis un CDN : le
 * Chromium qui rend ces pages tourne sans bac à sable sur le serveur de l'API.
 *
 * Lu une fois puis gardé en mémoire — 200 Ko, et un export compose jusqu'à sept pages.
 */
let cachedBundle: string | null = null

export function chartJsBundle(): string {
  if (cachedBundle === null) {
    // L'entrée principale est visée plutôt que `package.json`, que la carte d'exports du
    // paquet ne publie pas. Le bundle navigateur est son voisin dans `dist/`.
    const mainEntry = createRequire(__filename).resolve('chart.js')
    cachedBundle = readFileSync(join(mainEntry, '..', 'chart.umd.js'), 'utf-8')
  }

  return cachedBundle
}

export function chartJsScriptTag(): string {
  return `<script>${chartJsBundle()}</script>`
}
