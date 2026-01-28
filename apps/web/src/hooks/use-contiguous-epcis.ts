import { useQuery } from '@tanstack/react-query'
import { TEpci } from '@shared'

export const useContiguousEpcis = (epciCodes?: string | string[]) => {
  const getContiguousEpcis = async (): Promise<TEpci[]> => {
    if (!epciCodes || (Array.isArray(epciCodes) && epciCodes.length === 0)) return []

    try {
      const codes = Array.isArray(epciCodes) ? epciCodes : [epciCodes]
      const response = await fetch(`/api/epci/contiguous?codes=${codes.join(',')}`)

      if (!response.ok) {
        throw new Error('Failed to get contiguous epcis')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get contiguous epcis:', error)
      return []
    }
  }

  const codesKey = Array.isArray(epciCodes) ? epciCodes.join(',') : epciCodes

  const { data, isLoading } = useQuery({
    enabled: !!epciCodes && (Array.isArray(epciCodes) ? epciCodes.length > 0 : true),
    queryFn: () => getContiguousEpcis(),
    queryKey: ['contiguous-epcis', codesKey],
    placeholderData: (previousData) => previousData,
  })

  return { data: data || [], isLoading }
}
