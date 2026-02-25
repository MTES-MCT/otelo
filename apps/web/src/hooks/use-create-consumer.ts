import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateConsumerInput {
  name: string
}

interface CreateConsumerResponse {
  id: string
  name: string
  prefix: string
  active: boolean
  createdAt: string
  key: string
}

export const useCreateConsumer = () => {
  const queryClient = useQueryClient()

  const createConsumer = async (data: CreateConsumerInput): Promise<CreateConsumerResponse> => {
    const response = await fetch('/api/admin/consumers', {
      body: JSON.stringify(data),
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Failed to create consumer')
    }
    return response.json()
  }

  return useMutation({
    mutationFn: createConsumer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumers'] })
    },
  })
}
