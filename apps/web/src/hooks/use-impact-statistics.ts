'use client'

import type { TImpactStatistics } from '@shared'
import { useQuery } from '@tanstack/react-query'
import type { PeriodRange } from '~/components/admin/shared/period-selector'

/** Paramétrage des scénarios, documents d'urbanisme, impact et utilité perçue. */
export function useImpactStatistics(range: PeriodRange) {
  return useQuery<TImpactStatistics>({
    queryKey: ['impact-statistics', range.from, range.to],
    queryFn: async () => {
      const query = new URLSearchParams({ from: range.from, to: range.to })
      const response = await fetch(`/api/statistics/impact?${query.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch /api/statistics/impact')
      }

      return response.json()
    },
  })
}
