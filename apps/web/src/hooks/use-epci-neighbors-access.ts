import { useQuery } from '@tanstack/react-query'

const fetchAccess = async (): Promise<{ hasAccess: boolean }> => {
  const res = await fetch('/api/epci-neighbors/access-check')
  if (!res.ok) throw new Error('Failed to check epci neighbors access')
  return res.json()
}

export const useEpciNeighborsAccess = () => {
  const { data, isLoading } = useQuery({
    queryFn: fetchAccess,
    queryKey: ['epci-neighbors-access'],
    staleTime: 5 * 60 * 1000,
  })

  return {
    hasAccess: data?.hasAccess ?? false,
    isLoading,
  }
}
