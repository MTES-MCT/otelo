import { useQuery } from '@tanstack/react-query'
import { useSession } from '~/lib/auth/client'

const fetchAccess = async (): Promise<{ hasAccess: boolean }> => {
  const res = await fetch('/api/epci-neighbors/access-check')
  if (!res.ok) throw new Error('Failed to check epci neighbors access')
  return res.json()
}

export const useEpciNeighborsAccess = () => {
  const { data: session } = useSession()

  const { data, isLoading } = useQuery({
    queryFn: fetchAccess,
    enabled: !!session,
    queryKey: ['epci-neighbors-access'],
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    hasAccess: data?.hasAccess ?? false,
    isLoading,
  }
}
