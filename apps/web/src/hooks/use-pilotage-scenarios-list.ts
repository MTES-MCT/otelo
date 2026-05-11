import { useQuery } from '@tanstack/react-query'

export interface PilotageScenarioItem {
  simulationId: string
  simulationName: string
  epcis: string
  userTypology: string | null
  lastActivity: string
  hasExportExcel: boolean
  hasExportPpt: boolean
}

export function usePilotageScenariosList(territoire?: string, typology?: string) {
  return useQuery<PilotageScenarioItem[]>({
    queryKey: ['pilotage-scenarios-list', territoire, typology],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (territoire) params.set('territoire', territoire)
      if (typology) params.set('typology', typology)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/statistics/pilotage/scenarios-list${query}`)
      if (!res.ok) throw new Error('Failed to fetch scenarios list')
      return res.json()
    },
  })
}
