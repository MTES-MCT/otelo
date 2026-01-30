import { execSync } from 'node:child_process'
import { rmSync, existsSync } from 'node:fs'
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

console.log('\nBuild complete. Cleaning up...\n')

if (BUILD_TARGET === '@otelo/web') {
  rm('node_modules')
  rm('apps/api')
  rm('.cache')
} else {
  rm('apps/web')
}

console.log('\n[scalingo-postbuild] done.\n')
