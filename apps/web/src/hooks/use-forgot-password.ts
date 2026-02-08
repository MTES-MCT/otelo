'use client'

import { toast } from 'sonner'
import { authClient } from '~/lib/auth/client'

export const useForgotPassword = () => {
  const forgotPassword = async (email: string) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/modification-mot-de-passe',
    })

    if (error) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email de récupération")
      return
    }

    toast.success('Si un compte est rattaché à cette adresse email, vous recevrez un lien de récupération de mot de passe.')
  }

  return { forgotPassword }
}
