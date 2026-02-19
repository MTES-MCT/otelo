import { useMutation, useQueryClient } from '@tanstack/react-query'

interface UpdateConsumerInput {
  id: string
  name?: string
  active?: boolean
}

export const useUpdateConsumer = () => {
  const queryClient = useQueryClient()

  const updateConsumer = async ({ id, ...data }: UpdateConsumerInput) => {
    const response = await fetch(`/api/admin/consumers/${id}`, {
      body: JSON.stringify(data),
      method: 'PATCH',
    })
    if (!response.ok) {
      throw new Error('Failed to update consumer')
    }
    return response.json()
  }

  return useMutation({
    mutationFn: updateConsumer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumers'] })
    },
  })
}
