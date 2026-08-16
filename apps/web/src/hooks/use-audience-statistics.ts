'use client'

import type { TActivationStatistics, TAudienceStatistics } from '@shared'
import { useQuery } from '@tanstack/react-query'
import type { PeriodRange } from '~/components/admin/shared/period-selector'

async function fetchWithRange<T>(endpoint: string, range: PeriodRange): Promise<T> {
  const query = new URLSearchParams({ from: range.from, to: range.to })
  const response = await fetch(`${endpoint}?${query.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`)
  }

  return response.json()
}

/** Usage mesuré en base : connexions, temps connecté, partage. */
export function useAudienceStatistics(range: PeriodRange) {
  return useQuery<TAudienceStatistics>({
    queryKey: ['audience-statistics', range.from, range.to],
    queryFn: () => fetchWithRange('/api/statistics/audience', range),
  })
}

/** Entonnoir d'activation et rétention par cohorte. */
export function useActivationStatistics(range: PeriodRange) {
  return useQuery<TActivationStatistics>({
    queryKey: ['activation-statistics', range.from, range.to],
    queryFn: () => fetchWithRange('/api/statistics/activation', range),
  })
}
