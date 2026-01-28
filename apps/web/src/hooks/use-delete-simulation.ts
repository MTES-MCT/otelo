import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useDeleteSimulation = () => {
  const queryClient = useQueryClient()

  const deleteSimulation = async (simulationId: string) => {
    const response = await fetch(`/api/simulations/${simulationId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete simulation')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: deleteSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
