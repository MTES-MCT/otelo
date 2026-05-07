import { useQuery } from '@tanstack/react-query'

export interface EpciCoverageItem {
  epciCode: string
  epciName: string
  hasScenario: boolean
  totalFlux: number
  totalStock: number
  totalHousingNeeds: number
  nbScenarios: number
}

export function usePilotageEpcisCoverage(region?: string, department?: string, typology?: string) {
  return useQuery<EpciCoverageItem[]>({
    queryKey: ['pilotage-epcis-coverage', region, department, typology],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (region) params.set('region', region)
      if (department) params.set('department', department)
      if (typology) params.set('typology', typology)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/statistics/pilotage/epcis-coverage${query}`)
      if (!res.ok) throw new Error('Failed to fetch EPCI coverage data')
      return res.json()
    },
  })
}
