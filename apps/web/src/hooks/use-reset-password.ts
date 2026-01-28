import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ResetPasswordParams {
  newPassword: string
  confirmPassword: string
  token: string
}

export const useResetPassword = () => {
  const router = useRouter()
  const postResetPassword = async (params: ResetPasswordParams) => {
    const response = await fetch('/api/auth/reset-password', {
      body: JSON.stringify(params),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to reset password')
    }
    return response.json()
  }

  const { mutateAsync, isPending, isSuccess, isError } = useMutation({
    mutationFn: (data: ResetPasswordParams) => postResetPassword(data),
    onSuccess: () => {
      toast.success('Votre mot de passe a été réinitialisé avec succès')
      router.push('/connexion')
    },
    onError: () => {
      toast.error('Erreur lors de la réinitialisation du mot de passe')
    },
  })

  return { mutateAsync, isPending, isSuccess, isError }
}
