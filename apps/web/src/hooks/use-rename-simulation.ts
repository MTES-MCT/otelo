import { useMutation, useQueryClient } from '@tanstack/react-query'

interface RenameSimulationParams {
  simulationId: string
  name: string
}

export function useRenameSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ simulationId, name }: RenameSimulationParams) => {
      const response = await fetch(`/api/simulations/${simulationId}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error('Failed to rename simulation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations', 'dashboard-list'] })
    },
  })
}
