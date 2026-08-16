import dayjs from 'dayjs'

/** Format d'échange avec l'API pour les bornes de période. */
export const API_DATE_FORMAT = 'YYYY-MM-DD'

export function getDateFrom(daysAgo: number): string {
  return dayjs().subtract(daysAgo, 'day').format(API_DATE_FORMAT)
}

export function getToday(): string {
  return dayjs().format(API_DATE_FORMAT)
}

/** Étiquette courte d'axe de graphique. */
export function formatChartDate(date: string): string {
  return dayjs(date).format('DD/MM')
}

/** Étiquette de mois pour les séries mensuelles. */
export function formatChartMonth(date: string): string {
  return dayjs(date).format('MM/YYYY')
}

export function formatDate(date: string | Date | null | undefined): string {
  return date ? dayjs(date).format('DD/MM/YYYY') : '—'
}

/**
 * Durée lisible à partir de secondes.
 *
 * Les durées de session viennent de `login_events`, dont la granularité est de 15 minutes
 * (fréquence de renouvellement de session) : afficher des secondes serait trompeur au-delà
 * de l'heure, d'où le basculement en `Xh YYmin`.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0min'
  }

  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}min`
  }

  return `${hours}h ${minutes.toString().padStart(2, '0')}min`
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('fr-FR')
}

export function formatPercentage(value: number | null | undefined): string {
  return value == null ? '—' : `${value.toLocaleString('fr-FR')} %`
}
