import ExcelJS from 'exceljs'

/**
 * Lecture en flux des classeurs « Projections détaillées ».
 *
 * Les deux fichiers pèsent 71 et 104 Mo, et la feuille `Population_age_sexe` du classeur bassin
 * compte à elle seule 1 033 300 lignes : les charger en mémoire n'est pas une option. Le lecteur
 * en flux d'exceljs les traverse en une vingtaine de secondes pour ~350 Mo de RSS.
 *
 * Deux contraintes du format en découlent :
 *   - le zip est séquentiel, on ne peut pas se positionner sur une feuille : même les feuilles
 *     ignorées doivent être drainées ;
 *   - si `sharedStrings.xml` est écrit après les feuilles — courant avec les producteurs R et
 *     Python — exceljs déverse chaque feuille dans un fichier temporaire avant de l'analyser.
 *     Prévoir de l'espace dans `TMPDIR` ; ce n'est pas une fuite mémoire.
 */

export type SheetRowHandler = (row: SheetRow) => void | Promise<void>

export type SheetRow = {
  /** Numéro de ligne dans la feuille, en-tête comprise. */
  number: number
  /** Valeur d'une colonne, par son en-tête. */
  get(header: string): unknown
}

export type SheetVisitor = {
  /** Appelé une fois la ligne d'en-tête lue, avant toute ligne de données. */
  onHeaders?: (headers: string[]) => void
  onRow: SheetRowHandler
  /** Appelé après la dernière ligne de la feuille. */
  onEnd?: () => void | Promise<void>
}

/**
 * Traverse un classeur et confie chaque feuille reconnue à son visiteur.
 * Les feuilles sans visiteur sont drainées sans être analysées.
 */
export async function readProjectionWorkbook(filePath: string, visitors: Map<string, SheetVisitor>): Promise<void> {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    worksheets: 'emit',
    sharedStrings: 'cache',
    hyperlinks: 'ignore',
    styles: 'ignore',
    entries: 'ignore',
  })

  for await (const worksheet of reader) {
    // `name` est renseigné par exceljs (worksheet-reader.js) mais absent de ses déclarations de
    // types : c'est le seul moyen d'identifier la feuille dans le flux.
    const sheetName = (worksheet as unknown as { name: string }).name
    const visitor = visitors.get(sheetName)
    if (visitor === undefined) {
      // Drainage obligatoire : le flux ne permet pas de sauter une entrée du zip.
      for await (const _row of worksheet) {
        // no-op
      }
      continue
    }

    let indexByHeader: Map<string, number> | null = null

    for await (const row of worksheet) {
      const values = row.values as unknown[]

      if (indexByHeader === null) {
        indexByHeader = new Map()
        const headers: string[] = []
        for (let i = 1; i < values.length; i++) {
          const header = cellText(values[i])
          if (header === null) continue
          indexByHeader.set(header, i)
          headers.push(header)
        }
        visitor.onHeaders?.(headers)
        continue
      }

      const index = indexByHeader
      await visitor.onRow({
        number: row.number,
        get: (header) => {
          const at = index.get(header)
          return at === undefined ? undefined : unwrap(values[at])
        },
      })
    }

    await visitor.onEnd?.()
  }
}

/** Déballe une cellule : exceljs renvoie un objet pour les formules et les textes enrichis. */
function unwrap(value: unknown): unknown {
  if (value !== null && typeof value === 'object') {
    const cell = value as { result?: unknown; richText?: { text: string }[]; text?: unknown }
    if (cell.result !== undefined) return cell.result
    if (Array.isArray(cell.richText)) return cell.richText.map((part) => part.text).join('')
    if (cell.text !== undefined) return cell.text
  }
  return value
}

function cellText(value: unknown): string | null {
  const unwrapped = unwrap(value)
  if (unwrapped === null || unwrapped === undefined) return null
  return String(unwrapped).trim()
}

/** Convertit une cellule de mesure en nombre, ou `null` si elle est vide. */
export function toMeasure(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

/** Convertit une cellule de clé entière (ANNEE, AGE). Lève si la valeur n'est pas un entier. */
export function toInteger(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isInteger(parsed)) {
    throw new Error(`Valeur ${label} non entière : ${JSON.stringify(value)}`)
  }
  return parsed
}

/** Convertit une cellule de clé textuelle (ZONE, AGE_GROUPE). */
export function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}
