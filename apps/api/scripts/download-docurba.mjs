import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PUBLIC_DIR = join(__dirname, '..', 'public', 'docurba')

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })

const FORCE = process.argv.includes('--force')

async function download(url, filename) {
  const dest = join(PUBLIC_DIR, filename)
  const tmp = dest + '.tmp'

  if (!FORCE && existsSync(dest)) {
    console.log(`✓ ${filename} already present (use --force to re-download)`)
    return
  }

  console.log(`Downloading ${filename}...`)

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5 * 60 * 1000) })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)

    const ws = createWriteStream(tmp)
    await pipeline(Readable.fromWeb(res.body), ws)
    renameSync(tmp, dest)

    const mb = Math.round(statSync(dest).size / 1024 / 1024)
    console.log(`✓ ${filename} saved (${mb}MB)`)
  } catch (err) {
    console.error(`✗ Failed to download ${filename}: ${err.message}`)
    try {
      unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    if (existsSync(dest)) console.log(`  Keeping existing ${filename}`)
  }
}

await download('https://docurba.beta.gouv.fr/api/communes', 'communes.csv')
await download('https://docurba.beta.gouv.fr/api/scots', 'scots.csv')
await download('https://docurba.beta.gouv.fr/api/perimetres', 'perimetres.csv')
