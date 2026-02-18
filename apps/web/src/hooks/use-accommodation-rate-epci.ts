import { TEpcisAccommodationRates } from '@shared'
import { useQuery } from '@tanstack/react-query'

export const useAccommodationRatesByEpci = (epcis: Array<string>, millesime?: string) => {
  const getAccommodationRatesByEpci = async (): Promise<TEpcisAccommodationRates> => {
    try {
      const millesimeParam = millesime ? `&millesime=${millesime}` : ''
      const response = await fetch(`/api/accommodation-rates?epcis=${epcis.join(',')}${millesimeParam}`)
      if (!response.ok) {
        throw new Error('Failed to get accommodation rates by epci')
      }

      const data = await response.json()
      return data as TEpcisAccommodationRates
    } catch (error) {
      console.error('Failed to get accommodation rates by epci:', error)
      return {}
    }
  }

  const { data, isLoading } = useQuery({
    enabled: !!epcis.length,
    queryFn: getAccommodationRatesByEpci,
    queryKey: ['accommodation-rates-by-epci', epcis, millesime],
  })
  return { data, isLoading }
}
