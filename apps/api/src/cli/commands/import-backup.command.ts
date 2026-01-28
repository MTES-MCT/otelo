import { exec as callbackExec } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '~/db/prisma.service'
import { ScalingoBackupService } from '../services/scalingo-backup.service'

const exec = promisify(callbackExec)

@Injectable()
export class ImportBackupCommand {
  constructor(
    private readonly configService: ConfigService,
    private readonly scalingoBackupService: ScalingoBackupService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(): Promise<void> {
    console.log("✓ Variables d'environnement chargées")

    this.validateEnvironmentVariables()

    const downloadedFile = join(tmpdir(), `otelo-backup-${Date.now()}.tar.gz`)
    const extractDir = join(tmpdir(), `otelo-backup-${Date.now()}`)

    try {
      console.log('→ Récupération de la liste des backups Scalingo...')
      const latestBackup = await this.scalingoBackupService.getLatestBackup()
      console.log(`✓ Dernier backup trouvé : ${latestBackup.name} - ${new Date(latestBackup.created_at).toLocaleString('fr-FR')}`)

      console.log("→ Génération de l'URL de téléchargement...")
      const downloadUrl = await this.scalingoBackupService.getDownloadUrl(latestBackup.id)
      console.log('✓ URL de téléchargement obtenue')

      console.log('→ Téléchargement du backup...')
      await this.scalingoBackupService.downloadBackup(downloadUrl, downloadedFile)

      const downloadedStats = await stat(downloadedFile)
      console.log(`✓ Backup téléchargé : ${downloadedFile} (${(downloadedStats.size / 1024 / 1024).toFixed(2)} MB)`)

      console.log('→ Extraction du backup...')
      await exec(`mkdir -p "${extractDir}" && tar -xzf "${downloadedFile}" -C "${extractDir}"`)

      // Find the .pgsql or .dump file in the extracted directory
      const { stdout } = await exec(`find "${extractDir}" \\( -name "*.pgsql" -o -name "*.dump" \\) -type f`)
      const dumpFile = stdout.trim().split('\n')[0]

      if (!dumpFile) {
        throw new Error('Aucun fichier .pgsql ou .dump trouvé dans le backup')
      }

      const dumpStats = await stat(dumpFile)
      console.log(`✓ Backup extrait : ${dumpFile} (${(dumpStats.size / 1024 / 1024).toFixed(2)} MB)`)

      console.log('→ Nettoyage de la base de données locale...')
      await this.cleanDatabase()
      console.log('✓ Tables et enums supprimés')

      console.log('→ Restauration du backup...')
      await this.restoreBackup(dumpFile)
      console.log('✓ Backup restauré avec succès')

      console.log('→ Configuration des permissions...')
      await this.grantPermissions()
      console.log('✓ Permissions configurées')

      console.log('\n✓ Import terminé !')
    } catch (error) {
      console.error("✗ Erreur lors de l'import:", error)
      throw error
    } finally {
      // Cleanup temporary files
      try {
        await exec(`rm -rf "${extractDir}" "${downloadedFile}"`)
        console.log('✓ Fichiers temporaires supprimés')
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private validateEnvironmentVariables(): void {
    const requiredVars = [
      'SCALINGO_API_TOKEN',
      'SCALINGO_APP_NAME',
      'SCALINGO_ADDON_ID',
      'SCALINGO_DB_API_URL',
      'SCALINGO_REGION',
      'DATABASE_URL',
    ]

    const missingVars = requiredVars.filter((varName) => !this.configService.get<string>(varName))

    if (missingVars.length > 0) {
      throw new Error(`Variables d'environnement manquantes : ${missingVars.join(', ')}`)
    }
  }

  private async cleanDatabase(): Promise<void> {
    // Drop all tables
    const tables = await this.prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename::text
      FROM pg_tables
      WHERE schemaname = current_schema()
    `

    if (tables.length > 0) {
      const tableNames = tables.map(({ tablename }) => tablename).join('", "')
      await this.prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS "${tableNames}" CASCADE`)
    }

    // Drop all enum types
    const enums = await this.prisma.$queryRaw<{ schema: string; name: string }[]>`
      SELECT n.nspname::text as schema, t.typname::text as name
      FROM pg_type t
      LEFT JOIN pg_enum e ON t.oid = e.enumtypid
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE pg_catalog.pg_type_is_visible(t.oid)
        AND n.nspname = current_schema()
        AND t.typcategory = 'E'
      GROUP BY schema, name
    `

    if (enums.length > 0) {
      for (const { name } of enums) {
        await this.prisma.$queryRawUnsafe(`DROP TYPE IF EXISTS "${name}" CASCADE`)
      }
    }
  }

  private async restoreBackup(dumpFile: string): Promise<void> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL')
    try {
      await exec(`pg_restore --no-owner --no-acl -d "${databaseUrl}" "${dumpFile}"`, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      })
    } catch (error) {
      // pg_restore returns exit code 1 even for non-critical warnings
      // Check if it's just a configuration parameter error (e.g., transaction_timeout)
      const stderr = (error as { stderr?: string }).stderr || ''
      if (stderr.includes('errors ignored on restore: 1') && stderr.includes('configuration parameter')) {
        console.log('  ⚠ Avertissement pg_restore ignoré (paramètre de configuration non supporté localement)')
        return
      }
      throw error
    }
  }

  private async grantPermissions(): Promise<void> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL')
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined')
    }

    const urlObject = new URL(databaseUrl)
    const user = urlObject.username
    const database = urlObject.pathname.split('/')[1]

    if (!user || !database) {
      throw new Error('Could not parse user or database from DATABASE_URL')
    }

    await exec(`psql "${databaseUrl}" -c 'GRANT ALL PRIVILEGES ON DATABASE "${database}" TO "${user}";'`)
  }
}
