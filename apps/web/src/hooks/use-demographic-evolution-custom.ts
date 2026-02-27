import { useQuery } from '@tanstack/react-query'
import { TDemographicEvolutionOmphaleCustom } from '~/schemas/demographic-evolution-custom'

export const useDemographicEvolutionCustom = (ids: string[], millesime?: string | null) => {
  return useQuery<TDemographicEvolutionOmphaleCustom[]>({
    queryKey: ['demographic-evolution-custom-many', ids, millesime],
    queryFn: async () => {
      if (!ids || ids.length === 0) return []

      const params = new URLSearchParams()
      ids.forEach((id) => params.append('ids', id))
      if (millesime) params.append('millesime', millesime)
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
