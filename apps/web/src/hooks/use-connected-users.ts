import { useQuery } from '@tanstack/react-query'

interface ConnectedUser {
  id: string
  firstname: string
  lastname: string
}

interface ConnectionsResponse {
  count: number
  users: ConnectedUser[]
}

export function useConnectedUsers(simulationId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const { data } = useQuery<ConnectionsResponse>({
    queryKey: ['connections', simulationId],
    queryFn: async () => {
      const res = await fetch(`/api/simulations/${simulationId}/connections`)
      if (!res.ok) throw new Error('Failed to fetch connections')
      return res.json()
    },
    refetchInterval: enabled ? 15_000 : false,
    enabled,
  })

  return {
    count: enabled ? (data?.count ?? 0) : 0,
    users: enabled ? (data?.users ?? []) : [],
  }
}
