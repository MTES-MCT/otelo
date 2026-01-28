import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TUpdateUserType } from '~/schemas/user'

export const useUpdateUserType = () => {
  const updateUserType = async ({ type, userId }: TUpdateUserType) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    })
    if (!response.ok) {
      throw new Error('Failed to update user tpe')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: updateUserType,
    onSuccess: () => {
      toast.success("Votre type d'organisation a été mis à jour")
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du type d'organisation de l'utilisateur")
    },
  })
}
