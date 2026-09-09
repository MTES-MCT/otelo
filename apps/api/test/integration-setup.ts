import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { INTEGRATION_DATABASE_URL } from './integration-database'

/**
 * Prépare le schéma une fois pour toutes les suites d'intégration.
 *
 * `db push` plutôt que `migrate deploy` : les migrations ne rejouent pas sur une base
 * vierge, `20260824100000_add_projection_zones` insérant des zones qui référencent des
 * EPCI importés hors migration. Le schéma appliqué reste celui de `schema.prisma`, qui
 * est ce que les requêtes testées voient. La conformité des migrations elles-mêmes
 * relève d'un autre contrôle.
 *
 * Sans `--force-reset` : chaque suite vide les tables qu'elle utilise dans son
 * `beforeEach`, et une base qui aurait dérivé doit échouer bruyamment plutôt que
 * d'être écrasée en silence.
 */
export default function globalSetup(): void {
  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: INTEGRATION_DATABASE_URL },
    stdio: 'inherit',
  })
}
