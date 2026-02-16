'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth/client'

export const useResetPassword = () => {
  const [isPending, setIsPending] = useState(false)

  const resetPassword = async ({ newPassword, token }: { newPassword: string; token: string }) => {
    setIsPending(true)
    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    })
    setIsPending(false)

    if (error) {
      toast.error(error.message || 'Erreur lors de la réinitialisation du mot de passe')
      return
    }

    toast.success('Votre mot de passe a été réinitialisé avec succès')
    window.location.href = '/connexion'
  }

  return { resetPassword, isPending }
}
