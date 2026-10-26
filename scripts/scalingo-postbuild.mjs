import { execSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const BUILD_TARGET = process.env.BUILD_TARGET
const ROOT = process.cwd()

function rm(path) {
  const abs = join(ROOT, path)
  if (!existsSync(abs)) return
  rmSync(abs, { recursive: true, force: true })
  console.log(`  removed: ${path}`)
}

console.log(`\n[scalingo-postbuild] BUILD_TARGET=${BUILD_TARGET}\n`)

// scalingo-postbuild replaces "build" — run the build first
console.log('Running build...\n')
try {
  execSync(`pnpm --filter @otelo/shared build && pnpm --filter ${BUILD_TARGET} build`, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, CI: 'true' },
  })
} catch {
  console.error('\nBuild failed — aborting postbuild (no migrations will be applied).\n')
  process.exit(1)
}

console.log('\nBuild complete.\n')

if (BUILD_TARGET === '@otelo/web') {
  // Standalone output doesn't include static assets — copy them manually
  const webDir = join(ROOT, 'apps/web')
  const standaloneWeb = join(webDir, '.next/standalone/apps/web')

  cpSync(join(webDir, 'public'), join(standaloneWeb, 'public'), { recursive: true })
  console.log('  copied: public -> standalone/apps/web/public')

  cpSync(join(webDir, '.next/static'), join(standaloneWeb, '.next/static'), { recursive: true })
  console.log('  copied: .next/static -> standalone/apps/web/.next/static')

  console.log('\nCleaning up...\n')
  rm('node_modules')
  rm('apps/api')
  rm('.cache')
} else {
  console.log('Running prisma migrate deploy...\n')
  execSync('pnpm --filter @otelo/api prisma migrate deploy', {
    stdio: 'inherit',
    cwd: ROOT,
  })
  rm('apps/web')

  // Clean up unnecessary files to reduce slug size
  rm('.cache')
  rm('.git')
  rm('packages/shared/src')
  rm('apps/api/src')
  rm('apps/api/test')
  rm('apps/api/prisma/migrations')

  // Web-only packages left in the shared virtual store (devDependencies pruning is skipped by the buildpack).
  // next is only reachable through better-auth's optional next-js integration, unused by the API.
  const webOnly = /^(next@|@next\+|@img\+|@gouvfr\+|@codegouvfr\+|maplibre-gl@|@maplibre\+|@biomejs\+)/
  for (const entry of readdirSync(join(ROOT, 'node_modules/.pnpm'))) {
    if (webOnly.test(entry)) rm(`node_modules/.pnpm/${entry}`)
  }
}

console.log('\n[scalingo-postbuild] done.\n')
