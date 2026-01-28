import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useResendVerificationCodeEmail = () => {
  const postSendVerificationCodeEmail = async (params: { code: string }) => {
    const response = await fetch('/api/auth/confirmation-code-mail', {
      body: JSON.stringify(params),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to resend verification code email')
    }
    return response.json()
  }

  const { mutateAsync, isPending, isSuccess, isError } = useMutation({
    mutationFn: (code: string) => postSendVerificationCodeEmail({ code }),
    onSuccess: () => {
      toast.success('Email de vérification envoyé')
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de l'email de vérification")
    },
  })

  return { mutateAsync, isPending, isSuccess, isError }
}

export const useResendVerificationEmail = () => {
  const postSendVerificationEmail = async (params: { email: string }) => {
    const response = await fetch('/api/auth/confirmation-mail', {
      body: JSON.stringify(params),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to resend verification email')
    }
    return response.json()
  }

  const { mutateAsync, isPending, isSuccess, isError } = useMutation({
    mutationFn: (email: string) => postSendVerificationEmail({ email }),
    onSuccess: () => {
      toast.success('Email de vérification envoyé')
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de l'email de vérification")
    },
  })

  return { mutateAsync, isPending, isSuccess, isError }
}
