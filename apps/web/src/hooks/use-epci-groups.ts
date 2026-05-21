import { useQuery } from '@tanstack/react-query'
import { TEpciGroupWithEpcis } from '~/schemas/epci-group'

export const useEpciGroups = (options?: { withActiveSimulations?: boolean }) => {
  const params = options?.withActiveSimulations ? '?withActiveSimulations=true' : ''
  return useQuery<TEpciGroupWithEpcis[]>({
    queryKey: ['epci-groups', { withActiveSimulations: options?.withActiveSimulations }],
    queryFn: async () => {
      const response = await fetch(`/api/epci-groups${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch EPCI groups')
      }
      return response.json()
    },
  })
}
