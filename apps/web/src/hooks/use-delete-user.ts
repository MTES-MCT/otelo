import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  const deleteUser = async (userId: string) => {
    const response = await fetch(`/api/users/delete/${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
  }

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      toast.success('Utilisateur supprimé')
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'utilisateur")
    },
  })
}
