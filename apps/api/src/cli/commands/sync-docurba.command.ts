import { Injectable } from '@nestjs/common'
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { PrismaService } from '~/db/prisma.service'

const FILES = [
  { filename: 'communes.csv', url: 'https://docurba.beta.gouv.fr/api/communes' },
  { filename: 'scots.csv', url: 'https://docurba.beta.gouv.fr/api/scots' },
  { filename: 'perimetres.csv', url: 'https://docurba.beta.gouv.fr/api/perimetres' },
]

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000]

@Injectable()
export class SyncDocurbaCommand {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ force = false }: { force?: boolean } = {}): Promise<void> {
    const publicDir = join(__dirname, '..', '..', '..', 'public', 'docurba')
    if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

    for (const { filename, url } of FILES) {
      const dest = join(publicDir, filename)
      const downloaded = await this.download(url, filename, dest, force)
      if (downloaded) {
        await this.upsertToDb(filename, dest)
      } else {
        await this.restoreFromDb(filename, dest)
      }
    }
  }

  private async download(url: string, filename: string, dest: string, force: boolean): Promise<boolean> {
    const tmp = dest + '.tmp'

    if (!force && existsSync(dest)) {
      console.log(`✓ ${filename} already present (use --force to re-download)`)
      return true
    }

    console.log(`Downloading ${filename}...`)

    let lastErr: Error | undefined
    for (let i = 0; i <= RETRY_DELAYS_MS.length; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5 * 60 * 1000) })
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
        const ws = createWriteStream(tmp)
        await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), ws)
        renameSync(tmp, dest)
        const mb = Math.round(statSync(dest).size / 1024 / 1024)
        console.log(`✓ ${filename} saved (${mb}MB)`)
        return true
      } catch (err) {
        lastErr = err as Error
        try {
          unlinkSync(tmp)
        } catch {
          /* ignore */
        }
        if (i < RETRY_DELAYS_MS.length) {
          const delay = RETRY_DELAYS_MS[i]
          console.warn(`  Retry ${i + 1}/${RETRY_DELAYS_MS.length} for ${filename} in ${delay / 1000}s (${lastErr.message})`)
          await new Promise((r) => setTimeout(r, delay))
        }
      }
    }

    console.error(`✗ Failed to download ${filename}: ${lastErr?.message}`)
    return false
  }

  private async upsertToDb(filename: string, dest: string): Promise<void> {
    try {
      const content = await readFile(dest)
      await this.prisma.docurbaFile.upsert({
        where: { filename },
        create: { filename, content },
        update: { content },
      })
      console.log(`✓ ${filename} upserted to DB (${Math.round(content.length / 1024)}KB)`)
    } catch (err) {
      console.error(`✗ Failed to upsert ${filename}: ${(err as Error).message}`)
    }
  }

  private async restoreFromDb(filename: string, dest: string): Promise<void> {
    try {
      const row = await this.prisma.docurbaFile.findUnique({ where: { filename } })
      if (row) {
        writeFileSync(dest, row.content)
        console.log(`✓ ${filename} restored from DB (${Math.round(row.content.length / 1024)}KB)`)
      } else {
        console.warn(`⚠ ${filename} not found in DB and not on disk`)
      }
    } catch (err) {
      console.error(`✗ Failed to restore ${filename}: ${(err as Error).message}`)
    }
  }
}
