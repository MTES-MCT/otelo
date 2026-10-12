const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/

/**
 * Parse a number written in French or English notation ("12,5", "12.5", "1 234,5").
 * Returns null for empty values and throws for anything that is not a plain decimal.
 */
export function parseDecimal(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) throw new Error(`Valeur numérique invalide : "${raw}"`)
    return raw
  }

  const normalized = String(raw)
    .trim()
    .replace(/[\s  ]/g, '')
    .replace(',', '.')
  if (normalized === '') return null
  if (!DECIMAL_PATTERN.test(normalized)) throw new Error(`Valeur numérique invalide : "${raw}"`)

  return Number(normalized)
}
