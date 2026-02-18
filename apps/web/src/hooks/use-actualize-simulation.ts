import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ActualizeSimulationParams {
  simulationId: string
  data: { millesime: string; name?: string }
}

export function useActualizeSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ simulationId, data }: ActualizeSimulationParams) => {
      const response = await fetch(`/api/simulations/${simulationId}/actualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to actualize simulation')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations', 'dashboard-list'] })
    },
  })
}
