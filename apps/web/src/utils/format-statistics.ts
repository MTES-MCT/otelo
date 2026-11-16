/** Entier au format français : « 12 345 ». */
export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('fr-FR')
}

/** Mois `YYYY-MM` (ou date ISO) en toutes lettres : « janvier 2025 », ou « janv. 2025 » en version courte. */
export function formatMonth(month: string, short = false): string {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
  )
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular
}
