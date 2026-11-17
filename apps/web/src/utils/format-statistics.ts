/** Entier au format français : « 12 345 ». */
export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('fr-FR')
}

/** Population compacte : « 58,7 millions » dès un million, entier français en dessous. */
export function formatPopulation(value: number): string {
  if (value < 1_000_000) return formatInteger(value)
  const millions = value / 1_000_000
  const formatted = millions.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${formatted} ${millions < 2 ? 'million' : 'millions'}`
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
