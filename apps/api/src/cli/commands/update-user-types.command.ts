import { Injectable } from '@nestjs/common'
import { USER_TYPE_LABELS } from '@shared'
import * as ExcelJS from 'exceljs'
import * as fs from 'fs'
import Papa from 'papaparse'
import * as path from 'path'
import { PrismaService } from '~/db/prisma.service'
import { Prisma, UserType } from '~/generated/prisma/client'
import { resolveUserTypeLabel } from '~/users/user-type.utils'

type InputRow = {
  email: string
  typologie: string
}

type ValidatedRow = {
  email: string
  typologie: UserType
}

type ExistingUser = {
  email: string
  normalized_email: string
  type: UserType | null
}

const SUPPORTED_EXTENSIONS = new Set(['.csv', '.xlsx'])

@Injectable()
export class UpdateUserTypesCommand {
  constructor(private readonly prisma: PrismaService) {}

  async execute(options: { file: string; dryRun?: boolean; verbose?: boolean }): Promise<void> {
    const { file, dryRun = true, verbose = false } = options
    const absoluteFilePath = path.resolve(file)
    const extension = path.extname(absoluteFilePath).toLowerCase()

    if (!fs.existsSync(absoluteFilePath)) {
      console.error(`✗ Fichier introuvable : ${absoluteFilePath}`)
      process.exit(1)
    }

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      console.error(`✗ Format non supporté : ${extension || '(sans extension)'}. Formats supportés : .csv, .xlsx`)
      process.exit(1)
    }

    if (dryRun) {
      console.log('Mode DRY-RUN : aucune écriture en base. Utiliser --write pour persister.')
    } else {
      console.log('Mode WRITE : les typologies seront mises à jour en base.')
    }

    console.log(`Lecture du fichier : ${absoluteFilePath}`)
    const rows = await this.readInputFile(absoluteFilePath)

    if (rows.length === 0) {
      console.log('Aucune ligne à traiter.')
      return
    }

    console.log(`${rows.length} ligne(s) détectée(s)`)

    const validationErrors: string[] = []
    const uniqueRows = new Map<string, ValidatedRow>()

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2
      const normalizedEmail = row.email.trim().toLowerCase()
      const resolvedTypologie = resolveUserTypeLabel(row.typologie)

      if (!normalizedEmail) {
        validationErrors.push(`Ligne ${rowNumber}: email manquant`)
        continue
      }

      if (!this.isValidEmail(normalizedEmail)) {
        validationErrors.push(`Ligne ${rowNumber}: email invalide (${row.email})`)
        continue
      }

      if (!row.typologie.trim()) {
        validationErrors.push(`Ligne ${rowNumber}: typologie manquante pour ${normalizedEmail}`)
        continue
      }

      if (!resolvedTypologie) {
        validationErrors.push(
          `Ligne ${rowNumber}: typologie invalide pour ${normalizedEmail} (${row.typologie}). Valeurs acceptées: ${Object.values(USER_TYPE_LABELS).join(', ')}`,
        )
        continue
      }

      if (uniqueRows.has(normalizedEmail) && verbose) {
        console.log(
          `  ⚠ ${normalizedEmail}: doublon dans le fichier, la dernière typologie sera utilisée (${USER_TYPE_LABELS[resolvedTypologie]})`,
        )
      }

      uniqueRows.set(normalizedEmail, {
        email: normalizedEmail,
        typologie: resolvedTypologie,
      })
    }

    for (const error of validationErrors) {
      console.error(`  ✗ ${error}`)
    }

    const rowsToProcess = [...uniqueRows.values()]

    if (rowsToProcess.length === 0) {
      console.log(`\nTerminé: 0 mise à jour, ${validationErrors.length} échec(s)`)
      return
    }

    const existingUsers = await this.findExistingUsers(rowsToProcess.map((row) => row.email))
    const existingUsersByEmail = new Map(existingUsers.map((user) => [user.normalized_email, user]))

    let toUpdateCount = 0
    let unchangedCount = 0
    let notFoundCount = 0

    const rowsToUpdate: ValidatedRow[] = []

    for (const row of rowsToProcess) {
      const existingUser = existingUsersByEmail.get(row.email)

      if (!existingUser) {
        notFoundCount++
        if (verbose) {
          console.error(`  ✗ ${row.email}: utilisateur introuvable`)
        }
        continue
      }

      if (existingUser.type === row.typologie) {
        unchangedCount++
        if (verbose) {
          console.log(`  = ${row.email}: typologie inchangée (${USER_TYPE_LABELS[row.typologie]})`)
        }
        continue
      }

      rowsToUpdate.push(row)
      toUpdateCount++
      if (verbose) {
        console.log(
          `  ✓ ${row.email}: ${existingUser.type ? (USER_TYPE_LABELS[existingUser.type] ?? existingUser.type) : 'null'} → ${USER_TYPE_LABELS[row.typologie]}${dryRun ? ' [dry-run]' : ''}`,
        )
      }
    }

    if (!dryRun && rowsToUpdate.length > 0) {
      await this.bulkUpdateUserTypes(rowsToUpdate)
    }

    const failureCount = validationErrors.length + notFoundCount

    console.log('\nRésumé')
    console.log(`  - Lignes valides uniques: ${rowsToProcess.length}`)
    console.log(`  - Mises à jour${dryRun ? ' prévues' : ''}: ${toUpdateCount}`)
    console.log(`  - Inchangées: ${unchangedCount}`)
    console.log(`  - Emails introuvables: ${notFoundCount}`)
    console.log(`  - Échecs: ${failureCount}`)

    if (dryRun) {
      console.log('Aucune donnée écrite en base (dry-run). Relancer avec --write pour persister.')
    }
  }

  private async readInputFile(filePath: string): Promise<InputRow[]> {
    const extension = path.extname(filePath).toLowerCase()

    if (extension === '.csv') {
      return this.readCsvFile(filePath)
    }

    return this.readExcelFile(filePath)
  }

  private readCsvFile(filePath: string): InputRow[] {
    const content = fs.readFileSync(filePath, 'utf-8')
    const delimiter = this.detectCsvDelimiter(content)
    const parseResult = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      transformHeader: (header) => this.normalizeImportHeader(header),
    })

    if (parseResult.errors.length > 0) {
      const formattedErrors = parseResult.errors
        .slice(0, 5)
        .map((error) => `ligne ${error.row}: ${error.message}`)
        .join(', ')
      throw new Error(`Erreurs de parsing CSV: ${formattedErrors}`)
    }

    this.ensureExpectedColumns(parseResult.meta.fields ?? [])

    return parseResult.data.map((row) => ({
      email: row.email ?? '',
      typologie: row.typologie ?? '',
    }))
  }

  private async readExcelFile(filePath: string): Promise<InputRow[]> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('Le fichier Excel ne contient aucune feuille')
    }

    const headerRow = worksheet.getRow(1)
    const headerValues = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : []
    const headers = headerValues
      .map((value) =>
        String(value ?? '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean)

    this.ensureExpectedColumns(headers)

    const emailIndex = headers.indexOf('email') + 1
    const typologieIndex = headers.indexOf('typologie') + 1
    const rows: InputRow[] = []

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const email = String(row.getCell(emailIndex).value ?? '').trim()
      const typologie = String(row.getCell(typologieIndex).value ?? '').trim()

      if (!email && !typologie) {
        return
      }

      rows.push({ email, typologie })
    })

    return rows
  }

  private ensureExpectedColumns(headers: string[]): void {
    const missingColumns = ['email', 'typologie'].filter((column) => !headers.includes(column))

    if (missingColumns.length > 0) {
      throw new Error(`Colonnes manquantes: ${missingColumns.join(', ')}. Colonnes attendues: email, typologie`)
    }
  }

  private detectCsvDelimiter(content: string): string {
    const firstLine = content.split(/\r?\n/, 1)[0] ?? ''
    return firstLine.includes(';') ? ';' : ','
  }

  private normalizeImportHeader(header: string): string {
    const normalizedHeader = header.trim().toLowerCase()

    if (normalizedHeader.startsWith('typologie')) {
      return 'typologie'
    }

    return normalizedHeader
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  private async findExistingUsers(emails: string[]): Promise<ExistingUser[]> {
    if (emails.length === 0) {
      return []
    }

    return this.prisma.$queryRaw<ExistingUser[]>`
      SELECT email, LOWER(TRIM(email)) AS normalized_email, type
      FROM users
      WHERE LOWER(TRIM(email)) IN (${Prisma.join(emails)})
    `
  }

  private async bulkUpdateUserTypes(rows: ValidatedRow[]): Promise<void> {
    const values = Prisma.join(rows.map((row) => Prisma.sql`(${row.email}, ${row.typologie}::"UserType")`))

    await this.prisma.$executeRaw`
      UPDATE users AS u
      SET type = input.type
      FROM (VALUES ${values}) AS input(email, type)
      WHERE LOWER(TRIM(u.email)) = input.email
        AND u.type IS DISTINCT FROM input.type
    `
  }
}
