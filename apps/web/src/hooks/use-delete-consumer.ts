import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useDeleteConsumer = () => {
  const queryClient = useQueryClient()

  const deleteConsumer = async (id: string) => {
    const response = await fetch(`/api/admin/consumers/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete consumer')
    }
    return response
  }

  return useMutation({
    mutationFn: deleteConsumer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumers'] })
    },
  })
}
