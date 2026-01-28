import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useForgotPassword = () => {
  const postForgotPassword = async (params: { email: string }) => {
    const response = await fetch('/api/auth/forgot-password', {
      body: JSON.stringify(params),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to send forgot password email')
    }
    return response.json()
  }

  const { mutateAsync, isPending, isSuccess, isError } = useMutation({
    mutationFn: (email: string) => postForgotPassword({ email }),
    onSuccess: () => {
      toast.success('Si un compte est rattaché à cette adresse email, vous recevrez un lien de récupération de mot de passe.')
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de l'email de récupération")
    },
  })

  return { mutateAsync, isPending, isSuccess, isError }
}
