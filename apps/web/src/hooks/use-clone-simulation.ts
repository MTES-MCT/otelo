import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TCloneSimulationDto } from '~/schemas/simulation'

interface CloneSimulationParams {
  simulationId: string
  data: TCloneSimulationDto
}

export function useCloneSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ simulationId, data }: CloneSimulationParams) => {
      const response = await fetch(`/api/simulations/${simulationId}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to clone simulation')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate dashboard list to show the new cloned simulation
      queryClient.invalidateQueries({ queryKey: ['simulations', 'dashboard-list'] })
    },
  })
}
