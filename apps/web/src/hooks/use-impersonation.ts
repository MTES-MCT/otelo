'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface StartImpersonationParams {
  userId: string
}

interface StartImpersonationResponse {
  success: boolean
  message?: string
}

interface StopImpersonationResponse {
  success: boolean
  message?: string
}

const startImpersonation = async (userId: string): Promise<StartImpersonationResponse> => {
  const response = await fetch('/api/auth/impersonate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    throw new Error("Erreur lors du démarrage de l'usurpation")
  }

  return response.json()
}

const stopImpersonation = async (): Promise<StopImpersonationResponse> => {
  const response = await fetch('/api/auth/impersonate', {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error("Erreur lors de l'arrêt de l'usurpation")
  }

  return response.json()
}

export const useStartImpersonation = () => {
  return useMutation({
    mutationFn: ({ userId }: StartImpersonationParams) => startImpersonation(userId),
    onSuccess: () => {
      toast.success('Mode usurpation activé')
      window.location.reload()
    },
    onError: (error) => {
      console.log('error hook', error)
      toast.error(error.message || "Erreur lors du démarrage de l'usurpation")
    },
  })
}

export const useStopImpersonation = () => {
  return useMutation({
    mutationFn: stopImpersonation,
    onSuccess: () => {
      toast.success('Retour au mode administrateur')
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'arrêt de l'usurpation")
    },
  })
}
