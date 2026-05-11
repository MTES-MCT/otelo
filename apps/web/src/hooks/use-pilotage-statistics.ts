import { useQuery } from '@tanstack/react-query'

export interface PilotageStatistics {
  kpis: {
    totalActiveRegions: number
    totalActiveActors: number
    coverageRate: number
    totalScenarios: number
    totalExports: number
  }
  regions: string[]
  departments: Array<{ name: string; region: string }>
  actorsByRegion: Array<{
    region: string
    actorType: string
    nbUsers: number
    nbScenarios: number
    nbEpcis: number
    lastActivity: string | null
  }>
  housingByRegion: Array<{
    region: string
    totalFlux: number
    totalStock: number
    totalVacant: number
    totalHousingNeeds: number
  }>
}

export function usePilotageStatistics(region?: string, department?: string) {
  return useQuery<PilotageStatistics>({
    queryKey: ['pilotage-statistics', region, department],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (region) params.set('region', region)
      if (department) params.set('department', department)
      const query = params.toString() ? `?${params.toString()}` : ''

      const response = await fetch(`/api/statistics/pilotage${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pilotage statistics')
      }

      return response.json()
    },
  })
}
