import { useQuery } from '@tanstack/react-query'

interface Statistics {
  totalScenarios: number
  averageScenariosPerUser: number
  activeEpcisCount: number
  totalHousingNeedsSum: number
  totalStockSum: number
  totalVacantSum: number
  usersWithExportedScenarios: {
    total: number
    excel: number
    powerpoint: number
  }
}

export function useStatistics() {
  return useQuery<Statistics>({
    queryKey: ['statistics'],
    queryFn: async () => {
      const response = await fetch('/api/statistics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      return response.json()
    },
  })
}
