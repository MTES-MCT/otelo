import type { Response } from 'express'
import * as Papa from 'papaparse'

const UTF8_BOM = '﻿'
const CSV_DELIMITER = ';'

/** Excel consomme la tabulation et le retour chariot avant de lire le caractère suivant. */
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

/**
 * Une cellule commençant par `=` est exécutée à l'ouverture du fichier, sur le poste qui
 * le lit. Ces exports reprennent des valeurs saisies par les utilisateurs.
 */
function neutralizeFormula(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) {
    return value
  }

  return FORMULA_TRIGGERS.includes(value[0]) ? `'${value}` : value
}

export function sendCsv(res: Response, rows: Array<Record<string, unknown>>, filename: string, columns?: string[]): void {
  const safeRows = rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, neutralizeFormula(value)])))
  const input = safeRows.length === 0 && columns ? { data: [], fields: columns } : safeRows

  const csv = Papa.unparse(input, {
    columns: columns ?? (safeRows.length > 0 ? Object.keys(safeRows[0]) : undefined),
    delimiter: CSV_DELIMITER,
    header: true,
  })

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(`${UTF8_BOM}${csv}`)
}

export function csvDate(value: Date | string | null | undefined): string {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function csvBoolean(value: boolean | null | undefined): string {
  return value ? 'oui' : 'non'
}
