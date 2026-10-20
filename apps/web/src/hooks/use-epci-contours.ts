import { useQuery } from '@tanstack/react-query'
import type { EpciData } from '~/components/simulations/results/summary/simulation-needs-summary-map'

/** Contours des EPCI, pour la carte du territoire d'étude. Un échec renvoie une liste vide : la carte se masque. */
export const useEpciContours = (epciCodes: string[]) => {
  const codesKey = [...epciCodes].sort().join(',')

  const { data, isLoading } = useQuery({
    enabled: epciCodes.length > 0,
    queryFn: async (): Promise<EpciData[]> => {
      try {
        const response = await fetch(`/api/epci/contours?codes=${codesKey}`)
        if (!response.ok) {
          throw new Error('Failed to get epci contours')
        }
        return await response.json()
      } catch (error) {
        console.error('Failed to get epci contours:', error)
        return []
      }
    },
    queryKey: ['epci-contours', codesKey],
    placeholderData: (previousData) => previousData,
  })

  return { data: data ?? [], isLoading }
}
