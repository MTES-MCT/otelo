import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { TEpci } from '@shared'

export const useEpcis = (epcis?: string[]) => {
  const searchParams = useSearchParams()
  const epcisParams = epcis ?? searchParams.get('epcis')

  const getEpcisList = async (): Promise<TEpci[]> => {
    try {
      const response = await fetch(`/api/epci?epcis=${epcisParams}`)

      if (!response.ok) {
        throw new Error('Failed to get custom epcis list')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get custom epcis list:', error)
      return []
    }
  }

  const { data, isLoading } = useQuery({
    enabled: !!epcisParams,
    queryFn: () => getEpcisList(),
    queryKey: ['epcis-list', epcisParams],
    placeholderData: (previousData) => previousData,
  })
  return { data, isLoading }
}
