import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  const deleteUser = async (userId: string) => {
    const response = await fetch(`/api/users/delete/${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete user')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
