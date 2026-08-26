import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Injectable } from '@nestjs/common'
import ExcelJS from 'exceljs'
import { PrismaService } from '~/db/prisma.service'
import { AGE_GROUPS, isMeasureHeader, parseMeasureHeader } from './projections/projection-column-parser'
import {
  type ProjectionMeasureRow,
  ProjectionRowMerger,
  type ProjectionZoneStats,
  ProjectionZoneStatsAccumulator,
} from './projections/projection-row-merger'
import {
  DIMENSION_COLUMN,
  PROJECTION_SHEET_NAMES,
  PROJECTION_SHEETS,
  type ProjectionSheetConfig,
  SCENARIO_COLUMNS,
} from './projections/projection-sheets.config'
import { readProjectionWorkbook, type SheetVisitor, toInteger, toMeasure, toText } from './projections/projection-workbook-reader'
import {
  type PassageEntry,
  type ProjectionZoneLevelName,
  type ResolvedProjectionZone,
  resolveProjectionZones,
} from './projections/projection-zone-resolver'

const BATCH_SIZE = 1_000
const PROGRESS_EVERY = 100_000

export type ImportProjectionsOptions = {
  epciFile?: string
  bhFile?: string
  millesime?: string
  only?: string[]
  write: boolean
  emitZonesSql?: string
  passageFile?: string
}

type FileInput = { path: string; level: ProjectionZoneLevelName }

/**
 * Charge les classeurs « Projections détaillées » (population et ménages, aux niveaux EPCI et
 * bassin d'habitat) dans les tables `projection_*`.
 *
 * Commande distincte d'`import-csv`, qui ne peut pas servir ici : elle lit le CSV entier en
 * mémoire, concatène tout le SQL en une seule chaîne, ne connaît pas le XLSX, valide les codes
 * contre `epcis` uniquement, et génère du `ON CONFLICT DO NOTHING` — ce qui ferait d'un réimport
 * correctif un no-op silencieux. Aucun de ces comportements n'est acceptable pour 3,7 M de lignes
 * réparties sur 6 tables, dont deux réclament un dépliage de colonnes.
 */
@Injectable()
export class ImportProjectionsCommand {
  constructor(private readonly prisma: PrismaService) {}

  async execute(options: ImportProjectionsOptions): Promise<void> {
    const files = this.collectFiles(options)
    const sheets = this.selectSheets(options.only)

    if (options.emitZonesSql !== undefined) {
      await this.emitZonesSql(files, options)
      return
    }

    const millesime = await this.resolveMillesime(options.millesime)
    const knownZones = await this.loadKnownZones()

    console.log(`Millésime : ${millesime}`)
    console.log(`Feuilles  : ${sheets.map((sheet) => sheet.name).join(', ')}`)
    console.log(options.write ? 'Mode      : écriture en base' : 'Mode      : dry-run (aucune écriture)')

    for (const file of files) {
      await this.importFile(file, sheets, millesime, knownZones, options.write)
    }
  }

  // --------------------------------------------------------------------------------- entrées

  private collectFiles(options: ImportProjectionsOptions): FileInput[] {
    const files: FileInput[] = []
    if (options.epciFile !== undefined) files.push({ path: options.epciFile, level: 'EPCI' })
    if (options.bhFile !== undefined) files.push({ path: options.bhFile, level: 'BH' })
    if (files.length === 0) {
      throw new Error('Aucun fichier à traiter : renseigner --epci-file et/ou --bh-file')
    }

    // Vérifié ici plutôt que laissé remonter en ENOENT depuis exceljs : la commande tourne depuis
    // `apps/api`, alors que les classeurs vivent le plus souvent hors du dépôt. Un chemin relatif
    // mal compté est l'erreur la plus probable, autant la rendre lisible.
    const missing = files.filter((file) => !existsSync(file.path))
    if (missing.length > 0) {
      throw new Error(
        [
          `Fichier introuvable : ${missing.map((file) => file.path).join(', ')}`,
          `Les chemins relatifs sont résolus depuis ${process.cwd()}`,
          missing.map((file) => `  → tenté : ${resolve(file.path)}`).join('\n'),
        ].join('\n'),
      )
    }

    return files
  }

  private selectSheets(only?: string[]): ProjectionSheetConfig[] {
    if (only === undefined || only.length === 0) return PROJECTION_SHEETS
    const unknown = only.filter((name) => !PROJECTION_SHEET_NAMES.includes(name))
    if (unknown.length > 0) {
      throw new Error(`Feuille inconnue : ${unknown.join(', ')}. Feuilles disponibles : ${PROJECTION_SHEET_NAMES.join(', ')}`)
    }
    return PROJECTION_SHEETS.filter((sheet) => only.includes(sheet.name))
  }

  /**
   * Le millésime doit exister. `import-csv` crée le `DataPackVersion` manquant à la volée ; ici
   * ce serait un piège, ces données sont destinées au millésime actif et un millésime créé par
   * inadvertance passerait inaperçu.
   */
  private async resolveMillesime(millesime?: string): Promise<string> {
    if (millesime === undefined) {
      const active = await this.prisma.dataPackVersion.findFirst({ where: { isActive: true } })
      if (active === null) {
        throw new Error('Aucun millésime actif en base : préciser --millesime')
      }
      return active.millesime
    }

    const version = await this.prisma.dataPackVersion.findUnique({ where: { millesime } })
    if (version === null) {
      throw new Error(`Millésime « ${millesime} » inconnu de data_pack_versions. Le créer explicitement avant l'import.`)
    }
    return millesime
  }

  private async loadKnownZones(): Promise<Map<string, ProjectionZoneLevelName>> {
    const zones = await this.prisma.projectionZone.findMany({ select: { code: true, level: true } })
    if (zones.length === 0) {
      throw new Error("La table projection_zones est vide : appliquer la migration qui peuple le référentiel avant d'importer les mesures.")
    }
    return new Map(zones.map((zone) => [zone.code, zone.level as ProjectionZoneLevelName]))
  }

  // ------------------------------------------------------------------------ référentiel zones

  /**
   * Produit le bloc `VALUES` du référentiel, destiné à être relu puis collé dans la migration.
   * Le référentiel vit dans une migration et non dans cette commande : la table de passage INSEE
   * n'est pas versionnée avec le code et n'existe ni sur la CI ni en production, alors que les
   * mesures ont besoin du référentiel en place pour satisfaire leur clé étrangère.
   */
  private async emitZonesSql(files: FileInput[], options: ImportProjectionsOptions): Promise<void> {
    if (options.passageFile === undefined) {
      throw new Error('--emit-zones-sql requiert --passage-file (Table de passage EPCI - BH.xlsx)')
    }

    const [epcis, bassins] = await Promise.all([
      this.prisma.epci.findMany({ select: { code: true, name: true } }),
      this.prisma.bassin.findMany({ select: { name: true } }),
    ])
    const epciByCode = new Map(epcis.map((epci) => [epci.code, epci.name]))
    const bassinNames = bassins.map((bassin) => bassin.name)
    const passage = await readPassageTable(options.passageFile)

    const zones: ResolvedProjectionZone[] = []
    for (const file of files) {
      const codes = await this.readZoneCodes(file.path)
      const resolved = resolveProjectionZones({
        level: file.level,
        zoneCodes: codes,
        epcis: epciByCode,
        bassinNames,
        passage,
      })

      if (resolved.unknownEpciCodes.length > 0) {
        throw new Error(`Codes EPCI absents de la table epcis : ${resolved.unknownEpciCodes.join(', ')}`)
      }
      if (resolved.unresolvedBhCodes.length > 0) {
        console.warn(`⚠ ${resolved.unresolvedBhCodes.length} zone(s) BH sans bassin : ${resolved.unresolvedBhCodes.join(', ')}`)
      }
      zones.push(...resolved.zones)
    }

    zones.sort((a, b) => (a.level === b.level ? a.code.localeCompare(b.code) : a.level.localeCompare(b.level)))

    const rows = zones.map(
      (zone) =>
        `  (${sqlText(zone.code)}, ${sqlText(zone.level)}, ${sqlText(zone.label)}, ${sqlText(zone.epciCode)}, ${sqlText(zone.bassinName)})`,
    )
    writeFileSync(options.emitZonesSql as string, `${rows.join(',\n')}\n`, 'utf-8')

    const attached = zones.filter((zone) => zone.bassinName !== null || zone.epciCode !== null).length
    console.log(`${zones.length} zones écrites dans ${options.emitZonesSql}`)
    console.log(`  rattachées : ${attached} — sans rattachement : ${zones.length - attached}`)
    console.log(`  bassins distincts couverts : ${new Set(zones.map((z) => z.bassinName).filter(Boolean)).size}`)
  }

  /** Lit la seule colonne ZONE de `Population_totale` : suffisant pour bâtir le référentiel. */
  private async readZoneCodes(filePath: string): Promise<string[]> {
    const codes = new Set<string>()
    const visitors = new Map<string, SheetVisitor>([
      [
        'Population_totale',
        {
          onRow: (row) => {
            const code = toText(row.get('ZONE'))
            if (code !== null) codes.add(code)
          },
        },
      ],
    ])
    await readProjectionWorkbook(filePath, visitors)
    return [...codes]
  }

  // ------------------------------------------------------------------------------- import

  private async importFile(
    file: FileInput,
    sheets: ProjectionSheetConfig[],
    millesime: string,
    knownZones: Map<string, ProjectionZoneLevelName>,
    write: boolean,
  ): Promise<void> {
    console.log(`\n=== ${file.level} — ${file.path}`)

    const stats = new ProjectionZoneStatsAccumulator()
    const reports: SheetReport[] = []
    const visitors = new Map<string, SheetVisitor>()

    for (const sheet of sheets) {
      visitors.set(sheet.name, this.buildVisitor(sheet, file, millesime, knownZones, stats, write, reports))
    }

    await readProjectionWorkbook(file.path, visitors)

    for (const report of reports) {
      const emptyColumns = report.emptyMeasures()
      console.log(
        `  ${report.sheet.padEnd(20)} lues ${report.read.toString().padStart(9)} → insérées ${report.inserted.toString().padStart(9)}` +
          (report.merged > 0 ? ` (${report.merged} doublons ${2018} fusionnés)` : ''),
      )
      if (emptyColumns.length > 0) {
        console.log(`    colonnes intégralement vides ou nulles : ${emptyColumns.join(', ')}`)
      }
      for (const warning of report.warnings) {
        console.warn(`    ⚠ ${warning}`)
      }
    }

    await this.writeZoneStats(stats.values(), millesime, write)
  }

  private buildVisitor(
    sheet: ProjectionSheetConfig,
    file: FileInput,
    millesime: string,
    knownZones: Map<string, ProjectionZoneLevelName>,
    stats: ProjectionZoneStatsAccumulator,
    write: boolean,
    reports: SheetReport[],
  ): SheetVisitor {
    const report = new SheetReport(sheet.name)
    reports.push(report)

    const merger = new ProjectionRowMerger()
    let buffer: ProjectionMeasureRow[] = []
    let measureHeaders: { header: string; column: string; dimensionValue: string | null }[] = []
    let deleted = false

    const flush = async (rows: ProjectionMeasureRow[]): Promise<void> => {
      report.inserted += rows.length
      if (!write || rows.length === 0) return
      await this.insertBatch(sheet, rows, millesime)
    }

    return {
      onHeaders: (headers) => {
        measureHeaders = headers.filter(isMeasureHeader).map((header) => {
          const parsed = parseMeasureHeader(header)
          return { header, column: parsed.column, dimensionValue: parsed.dimensionValue }
        })
        const expected = sheet.dimension === 'sex' ? 18 : sheet.dimension === 'householdType' ? 63 : 9
        if (measureHeaders.length !== expected) {
          throw new Error(`${sheet.name} : ${measureHeaders.length} colonnes de mesure reconnues, ${expected} attendues`)
        }
      },

      onRow: async (row) => {
        const zoneCode = toText(row.get('ZONE'))
        if (zoneCode === null) return

        const level = knownZones.get(zoneCode)
        if (level === undefined) {
          report.unknownZones.add(zoneCode)
          return
        }
        // Le DELETE d'idempotence est cadré sur le niveau du fichier : une zone de l'autre niveau
        // ne serait pas purgée, et son réimport violerait la clé primaire. Les codes des deux
        // niveaux sont disjoints par construction, mais le jour où ce ne serait plus vrai il vaut
        // mieux s'arrêter que charger de travers.
        if (level !== file.level) {
          report.wrongLevelZones.add(`${zoneCode} (${level})`)
          return
        }

        if (write && !deleted) {
          deleted = true
          await this.deleteExisting(sheet.table, millesime, file.level)
        }

        report.read++
        const year = toInteger(row.get('ANNEE'), 'ANNEE')
        stats.record(zoneCode, year, toInteger(row.get('ind_robust'), 'ind_robust') === 1)

        const age = sheet.sourceKeyColumns.some((key) => key.header === 'AGE') ? toInteger(row.get('AGE'), 'AGE') : null

        const ageGroup = sheet.dimension === 'ageGroup' ? toText(row.get('AGE_GROUPE')) : null
        if (sheet.dimension === 'ageGroup' && (ageGroup === null || !AGE_GROUPS.has(ageGroup))) {
          throw new Error(`${sheet.name} : tranche d'âge inconnue ${JSON.stringify(ageGroup)}`)
        }

        for (const [dimensionValue, values] of this.splitByDimension(row, measureHeaders, sheet, ageGroup)) {
          const ready = merger.add({ zoneCode, year, age, dimensionValue, values })
          if (ready !== null) {
            buffer.push(ready)
            report.trackValues(ready)
          }
        }

        if (buffer.length >= BATCH_SIZE) {
          const batch = buffer
          buffer = []
          await flush(batch)
        }
        if (report.read % PROGRESS_EVERY === 0) {
          console.log(`    ${sheet.name} : ${report.read.toLocaleString('fr-FR')} lignes lues…`)
        }
      },

      onEnd: async () => {
        const remaining = merger.drain()
        for (const row of remaining) report.trackValues(row)
        await flush(buffer)
        buffer = []
        await flush(remaining)
        report.merged = Math.max(0, report.read * this.rowsPerSourceRow(sheet) - report.inserted)
        report.warnings.push(...merger.warnings)
        if (report.unknownZones.size > 0) {
          throw new Error(
            `${sheet.name} : ${report.unknownZones.size} zone(s) absente(s) de projection_zones : ${[...report.unknownZones].join(', ')}`,
          )
        }
        if (report.wrongLevelZones.size > 0) {
          throw new Error(
            `${sheet.name} : ${report.wrongLevelZones.size} zone(s) du fichier ${file.level} rattachée(s) à un autre niveau : ${[...report.wrongLevelZones].join(', ')}`,
          )
        }
      },
    }
  }

  private rowsPerSourceRow(sheet: ProjectionSheetConfig): number {
    if (sheet.dimension === 'sex') return 2
    if (sheet.dimension === 'householdType') return 7
    return 1
  }

  /**
   * Déplie les colonnes de mesure d'une ligne source en une ligne par modalité.
   * `Population_sexe` et `Population_age_sexe` donnent 2 lignes, `Menages_typologie` 7, les autres
   * feuilles une seule.
   */
  private splitByDimension(
    row: { get(header: string): unknown },
    measureHeaders: { header: string; column: string; dimensionValue: string | null }[],
    sheet: ProjectionSheetConfig,
    ageGroup: string | null,
  ): [string | null, (number | null)[]][] {
    const byDimension = new Map<string | null, (number | null)[]>()

    for (const entry of measureHeaders) {
      const key = sheet.dimension === 'ageGroup' ? ageGroup : entry.dimensionValue
      let values = byDimension.get(key)
      if (values === undefined) {
        values = new Array<number | null>(SCENARIO_COLUMNS.length).fill(null)
        byDimension.set(key, values)
      }
      values[SCENARIO_COLUMNS.indexOf(entry.column as (typeof SCENARIO_COLUMNS)[number])] = toMeasure(row.get(entry.header))
    }

    return [...byDimension.entries()]
  }

  // --------------------------------------------------------------------------------- écriture

  /**
   * Idempotence : la portée du DELETE est le couple millésime × niveau, de sorte que réimporter
   * le seul classeur bassin n'efface pas les données EPCI. On ne s'appuie pas sur
   * `ON CONFLICT DO NOTHING`, qui masquerait un réimport correctif.
   */
  private async deleteExisting(table: string, millesime: string, level: ProjectionZoneLevelName): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${table}" WHERE millesime = $1 AND zone_code IN (SELECT code FROM projection_zones WHERE level = $2::"ProjectionZoneLevel")`,
      millesime,
      level,
    )
  }

  private async insertBatch(sheet: ProjectionSheetConfig, rows: ProjectionMeasureRow[], millesime: string): Promise<void> {
    const keyColumns = ['zone_code', 'year']
    if (sheet.sourceKeyColumns.some((key) => key.header === 'AGE')) keyColumns.push('age')
    if (sheet.dimension !== 'none') keyColumns.push(DIMENSION_COLUMN[sheet.dimension])
    keyColumns.push('millesime')

    const columns = [...keyColumns, ...SCENARIO_COLUMNS]
    const dimensionCast = sheet.dimension === 'none' ? '' : `::"${ENUM_TYPE[sheet.dimension]}"`

    const values = rows.map((row) => {
      const key = [sqlText(row.zoneCode), String(row.year)]
      if (sheet.sourceKeyColumns.some((entry) => entry.header === 'AGE')) key.push(String(row.age))
      if (sheet.dimension !== 'none') key.push(`${sqlText(row.dimensionValue)}${dimensionCast}`)
      key.push(sqlText(millesime))
      return `(${[...key, ...row.values.map(sqlNumber)].join(',')})`
    })

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${sheet.table}" (${columns.map((column) => `"${column}"`).join(',')}) VALUES ${values.join(',')}`,
    )
  }

  private async writeZoneStats(stats: ProjectionZoneStats[], millesime: string, write: boolean): Promise<void> {
    const notRobust = stats.filter((stat) => !stat.isRobust)
    console.log(`  zones vues : ${stats.length} — non projetées (ind_robust = 0) : ${notRobust.length}`)
    if (notRobust.length > 0) {
      console.log(`    ${notRobust.map((stat) => stat.zoneCode).join(', ')}`)
    }
    if (!write || stats.length === 0) return

    for (let i = 0; i < stats.length; i += BATCH_SIZE) {
      const batch = stats.slice(i, i + BATCH_SIZE)
      const values = batch
        .map((stat) => `(${sqlText(stat.zoneCode)},${sqlText(millesime)},${stat.isRobust},${stat.firstYear},${stat.lastYear})`)
        .join(',')
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "projection_zone_millesimes" ("zone_code","millesime","is_robust","first_year","last_year")
         VALUES ${values}
         ON CONFLICT ("zone_code","millesime") DO UPDATE SET
           "is_robust" = EXCLUDED."is_robust",
           "first_year" = EXCLUDED."first_year",
           "last_year" = EXCLUDED."last_year"`,
      )
    }
  }
}

const ENUM_TYPE: Record<'sex' | 'ageGroup' | 'householdType', string> = {
  sex: 'ProjectionSex',
  ageGroup: 'ProjectionAgeGroup',
  householdType: 'ProjectionHouseholdType',
}

/** Suivi par feuille, pour le rapport de fin d'import. */
class SheetReport {
  read = 0
  inserted = 0
  merged = 0
  readonly warnings: string[] = []
  readonly unknownZones = new Set<string>()
  readonly wrongLevelZones = new Set<string>()
  private readonly scenarioSeen = new Array<boolean>(SCENARIO_COLUMNS.length).fill(false)
  private readonly modalitiesSeen = new Set<string>()
  private readonly modalitiesNonZero = new Set<string>()

  constructor(readonly sheet: string) {}

  trackValues(row: ProjectionMeasureRow): void {
    const modality = row.dimensionValue
    if (modality !== null) this.modalitiesSeen.add(modality)

    for (let i = 0; i < row.values.length; i++) {
      const value = row.values[i]
      if (value === null || value === 0) continue
      this.scenarioSeen[i] = true
      if (modality !== null) this.modalitiesNonZero.add(modality)
    }
  }

  /**
   * Colonnes de scénario et modalités restées intégralement vides ou nulles.
   *
   * C'est ce qui fait ressortir `ENFANT` et `HORS_MENAGE` de `Menages_typologie` — à 0 sur
   * l'intégralité des deux classeurs — sans avoir à les coder en dur, et ce qui signalerait
   * qu'un scénario entier manque dans une prochaine livraison.
   */
  emptyMeasures(): string[] {
    const emptyScenarios = SCENARIO_COLUMNS.filter((_, index) => !this.scenarioSeen[index])
    const emptyModalities = [...this.modalitiesSeen].filter((modality) => !this.modalitiesNonZero.has(modality))
    return [...emptyScenarios, ...emptyModalities.sort()]
  }
}

/** Lit la table de passage INSEE (1 243 lignes) : assez petite pour être chargée d'un bloc. */
export async function readPassageTable(filePath: string): Promise<PassageEntry[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]

  const headerRow = worksheet.getRow(1)
  const indexByHeader = new Map<string, number>()
  headerRow.eachCell((cell, index) => {
    const header = String(cell.value ?? '').trim()
    if (header !== '') indexByHeader.set(header, index)
  })

  const bhInseeAt = indexByHeader.get('BH_INSEE')
  const libBhAt = indexByHeader.get('LIB_BH')
  if (bhInseeAt === undefined || libBhAt === undefined) {
    throw new Error(`Table de passage : colonnes BH_INSEE et LIB_BH attendues dans ${filePath}`)
  }

  const entries: PassageEntry[] = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const bhInsee = String(row.getCell(bhInseeAt).value ?? '').trim()
    const libBh = String(row.getCell(libBhAt).value ?? '').trim()
    if (bhInsee === '' || libBh === '') return
    entries.push({ bhInsee, libBh })
  })
  return entries
}

function sqlText(value: string | null): string {
  return value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`
}

function sqlNumber(value: number | null): string {
  return value === null ? 'NULL' : String(value)
}
