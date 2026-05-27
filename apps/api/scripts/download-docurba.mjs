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

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000]

async function attempt(url, tmp) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5 * 60 * 1000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const ws = createWriteStream(tmp)
  await pipeline(Readable.fromWeb(res.body), ws)
}

async function download(url, filename) {
  const dest = join(PUBLIC_DIR, filename)
  const tmp = dest + '.tmp'

  if (!FORCE && existsSync(dest)) {
    console.log(`✓ ${filename} already present (use --force to re-download)`)
    return
  }

  console.log(`Downloading ${filename}...`)

  let lastErr
  for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
    try {
      await attempt(url, tmp)
      renameSync(tmp, dest)
      const mb = Math.round(statSync(dest).size / 1024 / 1024)
      console.log(`✓ ${filename} saved (${mb}MB)`)
      return
    } catch (err) {
      lastErr = err
      try {
        unlinkSync(tmp)
      } catch {
        /* ignore */
      }
      if (i < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[i]
        console.warn(`  Retry ${i + 1}/${RETRY_DELAYS_MS.length} for ${filename} in ${delay / 1000}s (${err.message})`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  console.error(`✗ Failed to download ${filename}: ${lastErr.message}`)
  if (existsSync(dest)) console.log(`  Keeping existing ${filename}`)
}

await download('https://docurba.beta.gouv.fr/api/communes', 'communes.csv')
await download('https://docurba.beta.gouv.fr/api/scots', 'scots.csv')
await download('https://docurba.beta.gouv.fr/api/perimetres', 'perimetres.csv')
