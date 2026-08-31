import type { Response } from 'express'
import * as Papa from 'papaparse'

const UTF8_BOM = '﻿'
const CSV_DELIMITER = ';'

export function sendCsv(res: Response, rows: Array<Record<string, unknown>>, filename: string, columns?: string[]): void {
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
