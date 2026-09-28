/** Postgres renvoie les agrégats numériques en `numeric`, que le driver mappe en string. */
export function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function percentage(part: number, total: number): number {
  return total === 0 ? 0 : round((part / total) * 100, 1)
}
