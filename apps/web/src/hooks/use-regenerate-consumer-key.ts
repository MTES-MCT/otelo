import { useMutation, useQueryClient } from '@tanstack/react-query'

interface RegenerateKeyResponse {
  id: string
  name: string
  prefix: string
  active: boolean
  createdAt: string
  expiresAt: string | null
  key: string
}

export const useRegenerateConsumerKey = () => {
  const queryClient = useQueryClient()

  const regenerateKey = async (id: string): Promise<RegenerateKeyResponse> => {
    const response = await fetch(`/api/admin/consumers/${id}/regenerate-key`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Failed to regenerate key')
    }
    return response.json()
  }

  return useMutation({
    mutationFn: regenerateKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumers'] })
    },
  })
}
