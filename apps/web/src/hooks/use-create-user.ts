import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TSignUp } from '~/schemas/user'

export type CreateUserData = TSignUp

interface CreateUserOptions {
  redirectUri?: string
  onSuccess?: () => void
}

export const useCreateUser = (options: CreateUserOptions = {}) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const postUser = async (userData: CreateUserData) => {
    try {
      // Remove confirmPassword from the data sent to API
      const { confirmPassword, ...userDataToSend } = userData

      const response = await fetch('/api/users', {
        body: JSON.stringify(userDataToSend),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create user account')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to create user with error:', error)
      throw error
    }
  }

  const { isPending, mutateAsync, error } = useMutation({
    mutationFn: (userData: CreateUserData) => postUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })

      toast.success('Compte créé avec succès !', {
        description: 'Vous pouvez maintenant vous connecter.',
      })

      if (options.onSuccess) {
        options.onSuccess()
      }

      const redirectPath = options.redirectUri ?? '/connexion'
      router.push(redirectPath)
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création du compte', {
        description: error.message || "Une erreur inattendue s'est produite.",
      })
    },
  })

  return { isPending, mutateAsync, error }
}
