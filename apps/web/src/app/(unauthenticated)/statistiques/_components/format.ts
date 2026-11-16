import type { TPublicEpciStatus, TPublicPlanningDocumentType } from '@otelo/shared'

export const EPCI_STATUS_LABELS: Record<TPublicEpciStatus, string> = {
  EXPORTED: 'A exporté au moins un scénario',
  SIMULATED: 'A réalisé au moins une simulation',
}

export const EPCI_STATUS_COLORS: Record<TPublicEpciStatus, { fill: string; stroke: string; opacity: number }> = {
  EXPORTED: { fill: '#000091', stroke: '#00006B', opacity: 0.75 },
  SIMULATED: { fill: '#7373FF', stroke: '#4040CC', opacity: 0.6 },
}

export const PLANNING_DOCUMENT_LABELS: Record<TPublicPlanningDocumentType, string> = {
  PLH_PLUI: 'PLH / PLUi-H',
  SCOT: 'SCoT',
  AUTRES: 'Autres documents',
}

export function formatDecimal(value: number): string {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

/** Date au format JJ/MM/AAAA, à l'heure de Paris. */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' }).format(
    new Date(iso),
  )
}

/** « une réduction de 15 % » ou, si l'objectif est une hausse, « une hausse de 4 % ». */
export function describeReduction(median: number): string {
  return median >= 0 ? `une réduction de ${formatDecimal(median)} %` : `une hausse de ${formatDecimal(-median)} %`
}
