import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface UpdateUserRegionParams {
  userId: string
  region: string | null
}

export const useUpdateUserRegion = () => {
  const queryClient = useQueryClient()

  const updateUserRegion = async ({ userId, region }: UpdateUserRegionParams) => {
    const response = await fetch(`/api/admin/users/${userId}/region`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ region }),
    })

    if (!response.ok) {
      throw new Error('Failed to update user region')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: updateUserRegion,
    onSuccess: () => {
      toast.success('Région mise à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la région')
    },
  })
}
