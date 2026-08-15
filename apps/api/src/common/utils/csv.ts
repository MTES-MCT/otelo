import type { Response } from 'express'
import * as Papa from 'papaparse'

/**
 * Marque d'ordre des octets UTF-8.
 *
 * Sans elle, Excel interprète le fichier en ANSI et casse tous les accents — un nom
 * d'EPCI ou un commentaire de retour utilisateur devient illisible.
 */
const UTF8_BOM = '﻿'

/** Le point-virgule est le séparateur attendu par Excel en configuration française. */
const CSV_DELIMITER = ';'

/**
 * Envoie un jeu de lignes en CSV téléchargeable.
 *
 * Un jeu vide produit un fichier avec seulement l'en-tête quand les colonnes sont
 * fournies, plutôt qu'un fichier vide : un export sans résultat doit rester lisible.
 */
export function sendCsv(res: Response, rows: Array<Record<string, unknown>>, filename: string, columns?: string[]): void {
  // Papaparse ignore `columns` sur un tableau vide et renvoie une chaîne vide : on lui
  // passe alors explicitement la liste des champs pour conserver la ligne d'en-tête.
  const input = rows.length === 0 && columns ? { data: [], fields: columns } : rows

  const csv = Papa.unparse(input, {
    columns: columns ?? (rows.length > 0 ? Object.keys(rows[0]) : undefined),
    delimiter: CSV_DELIMITER,
    header: true,
  })

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(`${UTF8_BOM}${csv}`)
}

/** Formate une date pour un tableur français, ou une chaîne vide si absente. */
export function csvDate(value: Date | string | null | undefined): string {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

/** Formate un booléen en oui/non, plus lisible qu'un `true`/`false` dans un tableur. */
export function csvBoolean(value: boolean | null | undefined): string {
  return value ? 'oui' : 'non'
}
