import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface ShareStatus {
  active: boolean
  token: string | null
}

export function useShareStatus(simulationId: string) {
  return useQuery<ShareStatus>({
    queryKey: ['share-status', simulationId],
    queryFn: async () => {
      const res = await fetch(`/api/simulations/${simulationId}/share`)
      if (!res.ok) throw new Error('Failed to fetch share status')
      return res.json()
    },
  })
}

export function useToggleShare(simulationId: string) {
  const queryClient = useQueryClient()

  return useMutation<ShareStatus>({
    mutationFn: async () => {
      const res = await fetch(`/api/simulations/${simulationId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to toggle share')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-status', simulationId] })
    },
  })
}
