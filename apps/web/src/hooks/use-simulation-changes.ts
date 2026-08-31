'use client'

import type { TSimulationChange } from '@shared'
import { useQuery } from '@tanstack/react-query'
import type { PeriodRange } from '~/components/admin/shared/period-selector'

export interface SimulationChangesPage {
  items: TSimulationChange[]
  total: number
  pageCount: number
}

export function useSimulationChanges(range: PeriodRange, options: { page: number; action?: string; search?: string }) {
  const { action, page, search } = options

  return useQuery<SimulationChangesPage>({
    queryKey: ['simulation-changes', range.from, range.to, page, action, search],
    queryFn: async () => {
      const query = new URLSearchParams({ from: range.from, page: String(page), to: range.to })

      if (action) {
        query.set('action', action)
      }

      if (search) {
        query.set('search', search)
      }

      const response = await fetch(`/api/statistics/simulation-changes?${query.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch simulation changes')
      }

      return response.json()
    },
  })
}
