import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import Papa from 'papaparse'
import * as path from 'path'
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

interface ParsedCsv {
  filePath: string
  rows: Record<string, string>[]
  headers: string[]
  mapping: Record<string, string | null>
}

@Injectable()
export class ImportCsvCommand {
  constructor(private readonly prisma: PrismaService) {}

  async execute(options: {
    table: string
    csv: string | string[]
    millesime?: string
    execute?: boolean
    output?: string
  }): Promise<void> {
    const { table, csv: csvInput, millesime, execute = false, output } = options
    const csvPaths = Array.isArray(csvInput) ? csvInput : [csvInput]

    // 1. Validate table name
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      console.error(`\n✗ Table "${table}" non autorisée.\n`)
      console.log('Tables disponibles :')
      ALLOWED_TABLES.forEach((t) => console.log(`  - ${t}`))
      process.exit(1)
    }

    // 2. Validate CSV files exist
    const absoluteCsvPaths = csvPaths.map((p) => path.resolve(p))
    for (const absPath of absoluteCsvPaths) {
      if (!fs.existsSync(absPath)) {
        console.error(`\n✗ Fichier CSV introuvable : ${absPath}`)
        process.exit(1)
      }
    }

    // 3. Get table columns from information_schema
    const columns: ColumnInfo[] = await this.prisma.$queryRaw`
      SELECT column_name::text, data_type::text, is_nullable::text
      FROM information_schema.columns
      WHERE table_name = ${table} 
      ORDER BY ordinal_position
    `

    if (columns.length === 0) {
      console.error(`\n✗ Table "${table}" introuvable en base. Vérifiez que les migrations sont à jour.`)
      process.exit(1)
    }

    // Deduplicate (information_schema may return duplicates across schemas)
    const seen = new Set<string>()
    const uniqueColumns = columns.filter((c) => {
      if (seen.has(c.column_name)) return false
      seen.add(c.column_name)
      return true
    })
    const dbColumnNames = uniqueColumns.map((c) => c.column_name)
    const dbColumnTypes = new Map(uniqueColumns.map((c) => [c.column_name, c.data_type]))
    const notNullColumns = new Set(uniqueColumns.filter((c) => c.is_nullable === 'NO').map((c) => c.column_name))

    console.log(`\n📋 Table "${table}" — ${columns.length} colonnes détectées`)

    // 3b. Fetch valid EPCI codes from DB
    const hasEpciCodeColumn = dbColumnNames.includes('epci_code')
    let validEpciCodes: Set<string> | null = null
    if (hasEpciCodeColumn) {
      const epcis: { code: string }[] = await this.prisma.$queryRaw`
        SELECT code::text FROM epcis
      `
      validEpciCodes = new Set(epcis.map((e) => e.code))
      console.log(`✓ ${validEpciCodes.size} codes EPCI valides en base`)
    }

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

    // 5. Columns to exclude from mapping (auto-managed)
    const autoColumns = new Set(['created_at', 'updated_at'])
    const targetDbColumns = dbColumnNames.filter((c) => !autoColumns.has(c))

    // If millesime provided, we inject it — don't expect it in CSV
    const columnsToMapFromCsv = millesime && hasMillesimeColumn
      ? targetDbColumns.filter((c) => c !== 'millesime')
      : targetDbColumns

    // 6. Parse each CSV and build mappings
    const parsedCsvs: ParsedCsv[] = []
    for (const absPath of absoluteCsvPaths) {
      const csvContent = fs.readFileSync(absPath, 'utf-8')
      const { data: rows, errors, meta } = Papa.parse<Record<string, string>>(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      })

      if (errors.length > 0) {
        console.error(`\n✗ Erreurs de parsing CSV (${path.basename(absPath)}) :`)
        errors.slice(0, 5).forEach((e) => console.error(`  Ligne ${e.row}: ${e.message}`))
        process.exit(1)
      }

      const csvHeaders = meta.fields || []
      const mapping = this.buildColumnMapping(csvHeaders, columnsToMapFromCsv)

      console.log(`\n✓ ${path.basename(absPath)} : ${rows.length} lignes, ${csvHeaders.length} colonnes`)

      const mapped = Object.entries(mapping).filter(([, dbCol]) => dbCol !== null)
      mapped.forEach(([csvH, dbCol]) => {
        if (csvH === dbCol) {
          console.log(`  ✓ ${csvH}`)
        } else {
          console.log(`  ✓ ${csvH} → ${dbCol}`)
        }
      })

      const unmappedCsv = Object.entries(mapping).filter(([, dbCol]) => dbCol === null).map(([h]) => h)
      if (unmappedCsv.length > 0) {
        console.log(`  ⚠  Colonnes CSV ignorées : ${unmappedCsv.join(', ')}`)
      }

      parsedCsvs.push({ filePath: absPath, rows, headers: csvHeaders, mapping })
    }

    // 7. If multiple CSVs, detect PK and merge rows
    let finalRows: Record<string, string | undefined>[]
    let allMappedDbColumns: string[]

    if (parsedCsvs.length > 1) {
      // Get PK columns for merge key
      const pkColumns: { column_name: string }[] = await this.prisma.$queryRaw`
        SELECT kcu.column_name::text
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = ${table}
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
      `
      const pkColumnNames = pkColumns.map((c) => c.column_name)

      if (pkColumnNames.length === 0) {
        console.error(`\n✗ Aucune clé primaire détectée pour la table "${table}". La fusion de plusieurs CSV nécessite une PK.`)
        process.exit(1)
      }

      // Filter PK columns that come from CSV (not injected millesime)
      const pkFromCsv = pkColumnNames.filter((pk) => !(millesime && hasMillesimeColumn && pk === 'millesime'))
      console.log(`\n🔑 Clé primaire : (${pkColumnNames.join(', ')})`)
      console.log(`   Fusion des ${parsedCsvs.length} CSV par : (${pkFromCsv.join(', ')})`)

      // Collect all mapped DB columns across all CSVs (union)
      const allDbColumnsSet = new Set<string>()
      // Map: dbCol → which CSV index provides it (last one wins if overlap)
      const dbColSource = new Map<string, number>()

      for (let csvIdx = 0; csvIdx < parsedCsvs.length; csvIdx++) {
        const mapped = Object.entries(parsedCsvs[csvIdx].mapping).filter(([, dbCol]) => dbCol !== null)
        for (const [, dbCol] of mapped) {
          allDbColumnsSet.add(dbCol!)
          dbColSource.set(dbCol!, csvIdx)
        }
      }
      allMappedDbColumns = columnsToMapFromCsv.filter((c) => allDbColumnsSet.has(c))

      // Build reverse mapping for each CSV: dbCol → csvHeader
      const reverseMappings: Map<string, string>[] = parsedCsvs.map((csv) => {
        const reverse = new Map<string, string>()
        for (const [csvH, dbCol] of Object.entries(csv.mapping)) {
          if (dbCol !== null) reverse.set(dbCol, csvH)
        }
        return reverse
      })

      // Index rows from each CSV by PK
      const mergedMap = new Map<string, Record<string, string | undefined>>()

      for (let csvIdx = 0; csvIdx < parsedCsvs.length; csvIdx++) {
        const csv = parsedCsvs[csvIdx]
        const reverseMap = reverseMappings[csvIdx]

        for (const row of csv.rows) {
          // Build PK key from CSV values
          const pkValues = pkFromCsv.map((pkCol) => {
            const csvHeader = reverseMap.get(pkCol)
            return csvHeader ? (row[csvHeader] ?? '').trim() : ''
          })
          const pkKey = pkValues.join('||')

          // Get or create merged row
          const existing = mergedMap.get(pkKey) || {}

          // Set PK columns
          for (const pkCol of pkFromCsv) {
            const csvHeader = reverseMap.get(pkCol)
            if (csvHeader && row[csvHeader] !== undefined) {
              existing[pkCol] = row[csvHeader]
            }
          }

          // Set data columns from this CSV (only non-empty values)
          for (const [csvH, dbCol] of Object.entries(csv.mapping)) {
            if (dbCol === null) continue
            if (pkFromCsv.includes(dbCol)) continue // already handled
            const val = row[csvH]
            if (val !== undefined && val !== null && val.trim() !== '') {
              existing[dbCol] = val
            }
          }

          mergedMap.set(pkKey, existing)
        }
      }

      finalRows = Array.from(mergedMap.values())
      console.log(`\n✓ Fusion terminée : ${finalRows.length} lignes uniques`)
    } else {
      // Single CSV — standard path
      const csv = parsedCsvs[0]
      const mapped = Object.entries(csv.mapping).filter(([, dbCol]) => dbCol !== null)
      allMappedDbColumns = mapped.map(([, dbCol]) => dbCol!)

      // Check for unmapped DB columns (strict in single-CSV mode)
      const unmappedDb = columnsToMapFromCsv.filter((db) => !allMappedDbColumns.includes(db))
      if (unmappedDb.length > 0) {
        console.error(`\n✗ Colonnes en base sans correspondance dans le CSV :`)
        unmappedDb.forEach((h) => console.error(`  - ${h}`))
        console.error(`\nVeuillez renommer les en-têtes du CSV ou ajouter les colonnes manquantes.`)
        console.error(`Astuce : les en-têtes CSV acceptés sont les noms PostgreSQL (snake_case).`)
        process.exit(1)
      }

      // Convert rows to use DB column names as keys
      const reverseMap = new Map<string, string>()
      for (const [csvH, dbCol] of Object.entries(csv.mapping)) {
        if (dbCol !== null) reverseMap.set(dbCol, csvH)
      }

      finalRows = csv.rows.map((row) => {
        const merged: Record<string, string | undefined> = {}
        for (const dbCol of allMappedDbColumns) {
          const csvH = reverseMap.get(dbCol)
          if (csvH) merged[dbCol] = row[csvH]
        }
        return merged
      })
    }

    // 8. Build final column list and SQL
    const finalDbColumns = [...allMappedDbColumns]
    if (millesime && hasMillesimeColumn) {
      finalDbColumns.push('millesime')
    }

    // Check for unmapped DB columns (multi-CSV: union of all CSVs must cover all DB columns)
    if (parsedCsvs.length > 1) {
      const unmappedDb = columnsToMapFromCsv.filter((db) => !allMappedDbColumns.includes(db))
      if (unmappedDb.length > 0) {
        console.log(`\n⚠  Colonnes en base absentes de tous les CSV (seront NULL) :`)
        unmappedDb.forEach((h) => console.log(`  - ${h}`))
      }
    }

    const sqlLines: string[] = []
    const BATCH_SIZE = 500

    const fileNames = absoluteCsvPaths.map((p) => path.basename(p)).join(' + ')
    sqlLines.push(`-- INSERT dans "${table}" pour millésime ${millesime || '(non spécifié)'}`)
    sqlLines.push(`-- Généré le ${new Date().toISOString().split('T')[0]}`)
    sqlLines.push(`-- ${finalRows.length} lignes depuis ${fileNames}`)
    sqlLines.push(`-- ON CONFLICT DO NOTHING : les doublons seront ignorés silencieusement`)
    sqlLines.push('')

    let totalCommented = 0

    for (let batchStart = 0; batchStart < finalRows.length; batchStart += BATCH_SIZE) {
      const batch = finalRows.slice(batchStart, batchStart + BATCH_SIZE)

      const columnList = finalDbColumns.map((c) => `"${c}"`).join(', ')
      sqlLines.push(`INSERT INTO "${table}" (${columnList})`)
      sqlLines.push('VALUES')

      const valueLines = batch.map((row, idx) => {
        const values = allMappedDbColumns.map((dbCol) => {
          const raw = row[dbCol]
          return this.formatValue(raw, dbColumnTypes.get(dbCol) || 'text')
        })
        if (millesime && hasMillesimeColumn) {
          values.push(`'${this.escapeString(millesime)}'`)
        }
        const comma = idx < batch.length - 1 ? ',' : ''

        // Check EPCI code exists in DB
        if (validEpciCodes) {
          const epciIdx = allMappedDbColumns.indexOf('epci_code')
          if (epciIdx !== -1) {
            const epciVal = (row['epci_code'] ?? '').trim()
            if (epciVal && !validEpciCodes.has(epciVal)) {
              totalCommented++
              return `  -- EPCI inconnu (${epciVal}) : (${values.join(', ')})${comma}`
            }
          }
        }

        // Check if any NOT NULL column has a NULL value
        const nullNotNullCols = allMappedDbColumns.filter((dbCol, i) =>
          notNullColumns.has(dbCol) && values[i] === 'NULL'
        )
        if (nullNotNullCols.length > 0) {
          totalCommented++
          return `  -- NULL sur NOT NULL (${nullNotNullCols.join(', ')}) : (${values.join(', ')})${comma}`
        }
        return `  (${values.join(', ')})${comma}`
      })

      sqlLines.push(...valueLines)
      sqlLines.push('ON CONFLICT DO NOTHING;')
      sqlLines.push('')
    }

    if (totalCommented > 0) {
      console.log(`⚠  ${totalCommented} ligne(s) commentée(s) (NULL sur colonne NOT NULL)`)
    }

    const insertedCount = finalRows.length - totalCommented

    const sql = sqlLines.join('\n')

    // 9. Output
    if (execute) {
      console.log(`\n🚀 Exécution en cours sur la base locale...`)
      try {
        await this.prisma.$executeRawUnsafe(sql)
        console.log(`✓ ${insertedCount} lignes importées avec succès (${totalCommented} ignorée(s) car NULL sur NOT NULL, doublons ignorés).`)
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
      console.log(`  ${insertedCount} lignes, ${Math.ceil(finalRows.length / BATCH_SIZE)} batch(es)${totalCommented > 0 ? `, ${totalCommented} commentée(s)` : ''}`)
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
      // "S" = secret statistique → 0
      if (trimmed.toLowerCase() === 's') return '0'
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
