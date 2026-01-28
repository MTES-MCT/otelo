import { useQuery } from '@tanstack/react-query'
import { TDemographicEvolutionOmphaleCustom } from '~/schemas/demographic-evolution-custom'

export const useDemographicEvolutionCustom = (ids: string[]) => {
  return useQuery<TDemographicEvolutionOmphaleCustom[]>({
    queryKey: ['demographic-evolution-custom-many', ids],
    queryFn: async () => {
      if (!ids || ids.length === 0) return []

      const params = new URLSearchParams()
      ids.forEach((id) => params.append('ids', id))
      const queryString = params.toString()
      const response = await fetch(`/api/demographic-evolution-custom/find-many?${queryString}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch custom demographic evolution data')
      }

      return response.json()
    },
    enabled: ids.length > 0,
  })
}
