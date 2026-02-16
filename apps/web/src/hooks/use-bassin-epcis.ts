import { TEpci } from '@shared'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

export const useBassinEpcis = (epci?: string) => {
  const searchParams = useSearchParams()
  const epciParams = epci ?? searchParams.get('epcis')?.split(',')[0]

  const getBassinEpcis = async (): Promise<TEpci[]> => {
    try {
      const response = await fetch(`/api/bassin/epcis/${epciParams}`)

      if (!response.ok) {
        throw new Error('Failed to get bassin epcis list')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get bassin epcis list:', error)
      return []
    }
  }

  const { data, isLoading } = useQuery({
    enabled: !!epciParams,
    queryFn: () => getBassinEpcis(),
    queryKey: ['bassin-epcis', epciParams],
  })
  return { data, isLoading }
}
