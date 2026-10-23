/**
 * Publie le worker de maplibre-gl dans `public/`.
 *
 * maplibre-gl 6 déduit l'URL de son worker de `import.meta.url`, que Turbopack réécrit : l'URL
 * calculée est vide et le navigateur charge la page HTML à la place du script. On sert donc le
 * worker comme fichier statique, désigné explicitement par `setWorkerUrl` (`ign-basemap-layer.tsx`).
 */
import { copyFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const source = require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs')
copyFileSync(source, new URL('../public/maplibre-gl-worker.mjs', import.meta.url))
console.log('maplibre-gl-worker.mjs copied to public/')
