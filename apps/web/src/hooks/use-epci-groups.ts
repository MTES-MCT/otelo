import { useQuery } from '@tanstack/react-query'
import { TEpciGroupWithEpcis } from '~/schemas/epci-group'

export const useEpciGroups = () => {
  return useQuery<TEpciGroupWithEpcis[]>({
    queryKey: ['epci-groups'],
    queryFn: async () => {
      const response = await fetch('/api/epci-groups')
      if (!response.ok) {
        throw new Error('Failed to fetch EPCI groups')
      }
      return response.json()
    },
  })
}
