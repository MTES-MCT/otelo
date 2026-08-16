'use client'

import { useQuery } from '@tanstack/react-query'

export interface AdminOverview {
  users: number
  usersWithAccess: number
  usersPending: number
  scenarios: number
  simulations: number
  feedbacks: number
  epciGroups: number
  activeShareLinks: number
}

/** Compteurs transverses de la coquille d'administration : pastilles de navigation et vue d'ensemble. */
export function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const response = await fetch('/api/statistics/overview')

      if (!response.ok) {
        throw new Error('Failed to fetch admin overview')
      }

      return response.json()
    },
  })
}
