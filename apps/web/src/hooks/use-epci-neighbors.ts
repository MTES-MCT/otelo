import { TEpciNeighborsResponse } from '@shared'
import { useQuery } from '@tanstack/react-query'

const fetchNeighbors = async (code: string, category: string): Promise<TEpciNeighborsResponse> => {
  const res = await fetch(`/api/epci-neighbors/${code}?category=${category}`)
  if (!res.ok) throw new Error('Failed to fetch epci neighbors')
  return res.json()
}

export const useEpciNeighbors = (epciCode: string | null, category: string) => {
  const { data, isLoading, error } = useQuery({
    enabled: !!epciCode,
    queryFn: () => fetchNeighbors(epciCode!, category),
    queryKey: ['epci-neighbors', epciCode, category],
  })

  return {
    epci: data?.epci ?? null,
    neighbors: data?.neighbors ?? [],
    isLoading,
    error,
  }
}
