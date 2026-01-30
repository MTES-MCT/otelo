import { execSync } from 'node:child_process'
import { rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BUILD_TARGET = process.env.BUILD_TARGET
const ROOT = process.cwd()

function rm(path) {
  const abs = join(ROOT, path)
  if (!existsSync(abs)) {
    console.log(`  skip (not found): ${path}`)
    return
  }
  rmSync(abs, { recursive: true, force: true })
  console.log(`  removed: ${path}`)
}

function run(cmd) {
  console.log(`  $ ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: ROOT })
}

console.log(`\n[scalingo-postbuild] BUILD_TARGET=${BUILD_TARGET}\n`)

if (BUILD_TARGET === '@otelo/web') {
  console.log('Cleaning up for Web deployment (standalone mode)...\n')

  // standalone has its own node_modules — remove the hoisted ones
  rm('node_modules')
  rm('apps/api')
  rm('packages/shared/src')
  rm('.cache')
  rm('apps/web/.next/cache')

  // Remove sourcemaps from standalone output
  const standaloneDir = join(ROOT, 'apps/web/.next/standalone')
  if (existsSync(standaloneDir)) {
    console.log('  removing sourcemaps from standalone...')
    execSync('find . -name "*.map" -delete', { cwd: standaloneDir, stdio: 'inherit' })
  }

} else if (BUILD_TARGET === '@otelo/api') {
  console.log('Cleaning up for API deployment...\n')

  rm('apps/web')
  rm('.cache')
  rm('packages/shared/src')

  // Prune devDependencies
  console.log('\nPruning devDependencies...')
  run('pnpm install --prod --frozen-lockfile || pnpm install --prod')

  // Remove sourcemaps
  console.log('\nRemoving sourcemaps...')
  execSync('find apps/api/dist -name "*.map" -delete 2>/dev/null || true', { cwd: ROOT, stdio: 'inherit' })

} else {
  console.log('No BUILD_TARGET set or unknown target — skipping cleanup.')
}

console.log('\n[scalingo-postbuild] done.\n')
