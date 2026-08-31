'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth/client'

export const useStartImpersonation = () => {
  const [isPending, setIsPending] = useState(false)

  const startImpersonation = async ({ userId }: { userId: string }) => {
    setIsPending(true)
    const { error } = await authClient.admin.impersonateUser({ userId })
    if (error) {
      toast.error(error.message || "Erreur lors du démarrage de l'usurpation")
      setIsPending(false)
      return
    }
    toast.success('Mode usurpation activé')
    window.location.href = '/tableaux-de-bord'
  }

  return { startImpersonation, isPending }
}

export const useStopImpersonation = () => {
  const [isPending, setIsPending] = useState(false)

  const stopImpersonation = async () => {
    setIsPending(true)
    const { error } = await authClient.admin.stopImpersonating()
    if (error) {
      toast.error(error.message || "Erreur lors de l'arrêt de l'usurpation")
      setIsPending(false)
      return
    }
    toast.success('Retour au mode administrateur')
    window.location.href = '/admin/utilisateurs'
  }

  return { stopImpersonation, isPending }
}
