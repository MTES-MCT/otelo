import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
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
execSync(`pnpm --filter @shared build && pnpm --filter ${BUILD_TARGET} build`, {
  stdio: 'inherit',
  cwd: ROOT,
  env: { ...process.env, CI: 'true' },
})

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
}

console.log('\n[scalingo-postbuild] done.\n')
