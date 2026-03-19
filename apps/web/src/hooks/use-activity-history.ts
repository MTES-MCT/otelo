import { useQuery } from '@tanstack/react-query'

export interface ActivityEntry {
  id: string
  action: string
  details: string | null
  createdAt: string
  user: { id: string; firstname: string; lastname: string }
}

export const useActivityHistory = (simulationId: string, { limit = 50 }: { limit?: number } = {}) => {
  const { data, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['activity', simulationId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/simulations/${simulationId}/activity?limit=${limit}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  return { activities: data ?? [], isLoading }
}
