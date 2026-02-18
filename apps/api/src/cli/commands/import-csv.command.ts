import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'
import { PrismaService } from '~/db/prisma.service'

/** Tables that can be imported (data tables linked to DataPackVersion) */
const ALLOWED_TABLES = [
  'bad_quality_filocom',
  'bad_quality_rp',
  'bad_quality_fonciers',
  'physical_inadequation_rp',
  'physical_inadequation_filo',
  'financial_inadequation',
  'filocom_flux',
  'hosted_filocom',
  'hosted_finess',
  'hosted_sne',
  'hotel',
  'makeshift_housing_rp',
  'makeshift_housing_sne',
  'homeless',
  'social_parc',
  'rp',
  'sitadel',
  'demographic_evolution_omphale',
  'demographic_evolution_population',
  'household_sizes',
  'vacancy_accommodation',
  'data_pack_versions',
] as const

type AllowedTable = (typeof ALLOWED_TABLES)[number]

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
}

@Injectable()
export class ImportCsvCommand {
  constructor(private readonly prisma: PrismaService) {}

  async execute(options: {
    table: string
    csv: string
    millesime?: string
    execute?: boolean
    output?: string
  }): Promise<void> {
    const { table, csv: csvPath, millesime, execute = false, output } = options

    // 1. Validate table name
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      console.error(`\n✗ Table "${table}" non autorisée.\n`)
      console.log('Tables disponibles :')
      ALLOWED_TABLES.forEach((t) => console.log(`  - ${t}`))
      process.exit(1)
    }

    // 2. Validate CSV file exists
    const absoluteCsvPath = path.resolve(csvPath)
    if (!fs.existsSync(absoluteCsvPath)) {
      console.error(`\n✗ Fichier CSV introuvable : ${absoluteCsvPath}`)
      process.exit(1)
    }

    // 3. Get table columns from information_schema
    const columns: ColumnInfo[] = await this.prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${table}
      ORDER BY ordinal_position
    `

    if (columns.length === 0) {
      console.error(`\n✗ Table "${table}" introuvable en base. Vérifiez que les migrations sont à jour.`)
      process.exit(1)
    }

    const dbColumnNames = columns.map((c) => c.column_name)
    const dbColumnTypes = new Map(columns.map((c) => [c.column_name, c.data_type]))

    console.log(`\n📋 Table "${table}" — ${columns.length} colonnes détectées`)

    // 4. If millesime is provided and table has millesime column, validate DataPackVersion
    const hasMillesimeColumn = dbColumnNames.includes('millesime')
    if (millesime && hasMillesimeColumn) {
      const existingVersion = await this.prisma.dataPackVersion.findUnique({
        where: { millesime },
      })
      if (!existingVersion) {
        console.log(`\n⚠  DataPackVersion "${millesime}" n'existe pas en base.`)
        console.log(`   Création automatique...`)
        await this.prisma.dataPackVersion.create({
          data: {
            millesime,
            label: `Millésime ${millesime}`,
            isActive: false,
          },
        })
        console.log(`   ✓ DataPackVersion "${millesime}" créée (isActive: false)`)
      } else {
        console.log(`✓ DataPackVersion "${millesime}" existe (isActive: ${existingVersion.isActive})`)
      }
    }

    // 5. Parse CSV
    const csvContent = fs.readFileSync(absoluteCsvPath, 'utf-8')
    const { data: rows, errors, meta } = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // We handle types ourselves
    })

    if (errors.length > 0) {
      console.error('\n✗ Erreurs de parsing CSV :')
      errors.slice(0, 5).forEach((e) => console.error(`  Ligne ${e.row}: ${e.message}`))
      process.exit(1)
    }

    const csvHeaders = meta.fields || []
    console.log(`✓ CSV lu : ${rows.length} lignes, ${csvHeaders.length} colonnes`)

    // 6. Map CSV headers to DB columns
    // Columns to exclude from mapping (auto-managed)
    const autoColumns = new Set(['created_at', 'updated_at'])
    const targetDbColumns = dbColumnNames.filter((c) => !autoColumns.has(c))

    // If millesime provided, we inject it — don't expect it in CSV
    const columnsToMapFromCsv = millesime && hasMillesimeColumn
      ? targetDbColumns.filter((c) => c !== 'millesime')
      : targetDbColumns

    const mapping = this.buildColumnMapping(csvHeaders, columnsToMapFromCsv)

    // Report mapping
    const mapped = Object.entries(mapping).filter(([, dbCol]) => dbCol !== null)
    const unmappedCsv = Object.entries(mapping).filter(([, dbCol]) => dbCol === null).map(([h]) => h)
    const unmappedDb = columnsToMapFromCsv.filter((db) => !mapped.some(([, dbCol]) => dbCol === db))

    console.log(`\n🔗 Mapping des colonnes (${mapped.length}/${columnsToMapFromCsv.length}) :`)
    mapped.forEach(([csvH, dbCol]) => {
      if (csvH === dbCol) {
        console.log(`  ✓ ${csvH}`)
      } else {
        console.log(`  ✓ ${csvH} → ${dbCol}`)
      }
    })

    if (unmappedCsv.length > 0) {
      console.log(`\n⚠  Colonnes CSV ignorées (pas de correspondance en base) :`)
      unmappedCsv.forEach((h) => console.log(`  - ${h}`))
    }

    if (unmappedDb.length > 0) {
      console.error(`\n✗ Colonnes en base sans correspondance dans le CSV :`)
      unmappedDb.forEach((h) => console.error(`  - ${h}`))
      console.error(`\nVeuillez renommer les en-têtes du CSV ou ajouter les colonnes manquantes.`)
      console.error(`Astuce : les en-têtes CSV acceptés sont les noms PostgreSQL (snake_case).`)
      process.exit(1)
    }

    // 7. Build final column list and SQL
    const finalDbColumns = mapped.map(([, dbCol]) => dbCol!)
    if (millesime && hasMillesimeColumn) {
      finalDbColumns.push('millesime')
    }

    const sqlLines: string[] = []
    const BATCH_SIZE = 500

    // Header comment
    sqlLines.push(`-- Import dans "${table}" pour millésime ${millesime || '(non spécifié)'}`)
    sqlLines.push(`-- Généré le ${new Date().toISOString().split('T')[0]}`)
    sqlLines.push(`-- ${rows.length} lignes depuis ${path.basename(absoluteCsvPath)}`)
    sqlLines.push(`-- ON CONFLICT DO NOTHING : les doublons seront ignorés silencieusement`)
    sqlLines.push('')

    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE)

      const columnList = finalDbColumns.map((c) => `"${c}"`).join(', ')
      sqlLines.push(`INSERT INTO "${table}" (${columnList})`)
      sqlLines.push('VALUES')

      const valueLines = batch.map((row, idx) => {
        const values = mapped.map(([csvH, dbCol]) => {
          const raw = row[csvH]
          return this.formatValue(raw, dbColumnTypes.get(dbCol!) || 'text')
        })
        if (millesime && hasMillesimeColumn) {
          values.push(`'${this.escapeString(millesime)}'`)
        }
        const comma = idx < batch.length - 1 ? ',' : ''
        return `  (${values.join(', ')})${comma}`
      })

      sqlLines.push(...valueLines)
      sqlLines.push('ON CONFLICT DO NOTHING;')
      sqlLines.push('')
    }

    const sql = sqlLines.join('\n')

    // 8. Output
    if (execute) {
      console.log(`\n🚀 Exécution en cours sur la base locale...`)
      try {
        await this.prisma.$executeRawUnsafe(sql)
        console.log(`✓ ${rows.length} lignes importées avec succès (doublons ignorés).`)
      } catch (error) {
        console.error(`\n✗ Erreur SQL :`, error instanceof Error ? error.message : error)
        console.error(`\nLe SQL a été écrit dans import-error.sql pour debug.`)
        fs.writeFileSync('import-error.sql', sql)
        process.exit(1)
      }
    } else if (output) {
      const absoluteOutput = path.resolve(output)
      fs.writeFileSync(absoluteOutput, sql)
      console.log(`\n✓ SQL écrit dans ${absoluteOutput}`)
      console.log(`  ${rows.length} lignes, ${Math.ceil(rows.length / BATCH_SIZE)} batch(es)`)
      console.log(`\nPour exécuter en local : ajouter --execute`)
      console.log(`Pour exécuter manuellement : copier le SQL dans pgAdmin/DBeaver`)
    } else {
      // Print to stdout
      console.log('\n--- SQL généré ---\n')
      console.log(sql)
      console.log('--- Fin du SQL ---')
      console.log(`\nOptions :`)
      console.log(`  --output fichier.sql   Écrire dans un fichier`)
      console.log(`  --execute              Exécuter directement en base locale`)
    }
  }

  /**
   * Maps CSV headers to DB column names using multiple strategies
   */
  private buildColumnMapping(
    csvHeaders: string[],
    dbColumns: string[],
  ): Record<string, string | null> {
    const mapping: Record<string, string | null> = {}
    const matchedDb = new Set<string>()

    for (const csvH of csvHeaders) {
      const trimmed = csvH.trim()

      // Strategy 1: Exact match
      if (dbColumns.includes(trimmed) && !matchedDb.has(trimmed)) {
        mapping[csvH] = trimmed
        matchedDb.add(trimmed)
        continue
      }

      // Strategy 2: Case-insensitive match
      const lowerMatch = dbColumns.find(
        (db) => db.toLowerCase() === trimmed.toLowerCase() && !matchedDb.has(db),
      )
      if (lowerMatch) {
        mapping[csvH] = lowerMatch
        matchedDb.add(lowerMatch)
        continue
      }

      // Strategy 3: camelCase → snake_case
      const snakeCase = this.toSnakeCase(trimmed)
      if (dbColumns.includes(snakeCase) && !matchedDb.has(snakeCase)) {
        mapping[csvH] = snakeCase
        matchedDb.add(snakeCase)
        continue
      }

      // Strategy 4: Common aliases
      const alias = this.resolveAlias(trimmed)
      if (alias && dbColumns.includes(alias) && !matchedDb.has(alias)) {
        mapping[csvH] = alias
        matchedDb.add(alias)
        continue
      }

      // No match
      mapping[csvH] = null
    }

    return mapping
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase()
  }

  private resolveAlias(header: string): string | null {
    const aliases: Record<string, string> = {
      epci: 'epci_code',
      code_epci: 'epci_code',
      epci_code: 'epci_code',
      code: 'epci_code',
      annee: 'year',
      année: 'year',
      year: 'year',
    }
    return aliases[header.toLowerCase()] || null
  }

  private formatValue(raw: string | undefined | null, dbType: string): string {
    if (raw === undefined || raw === null || raw.trim() === '') {
      return 'NULL'
    }

    const trimmed = raw.trim()

    // Numeric types — preserve raw values, just normalize comma → dot
    if (
      dbType === 'integer' ||
      dbType === 'bigint' ||
      dbType === 'smallint' ||
      dbType === 'double precision' ||
      dbType === 'real' ||
      dbType === 'numeric'
    ) {
      const normalized = trimmed.replace(',', '.')
      if (!/^-?\d+(\.\d+)?$/.test(normalized)) return 'NULL'
      return normalized
    }

    // String/text types
    return `'${this.escapeString(trimmed)}'`
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "''")
  }
}
