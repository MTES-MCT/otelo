import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface UpdateUserAccessParams {
  userId: string
  hasAccess: boolean
}

export const useUpdateUserAccess = () => {
  const queryClient = useQueryClient()

  const updateUserAccess = async ({ userId, hasAccess }: UpdateUserAccessParams) => {
    const response = await fetch(`/api/admin/users/${userId}/access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hasAccess }),
    })

    if (!response.ok) {
      throw new Error('Failed to update user access')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: updateUserAccess,
    onSuccess: () => {
      toast.success('Accès utilisateur mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'accès utilisateur")
    },
  })
}
