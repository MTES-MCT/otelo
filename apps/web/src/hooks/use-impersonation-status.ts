'use client'

import { useQuery } from '@tanstack/react-query'

interface ImpersonationStatus {
  isImpersonating: boolean
  impersonatedUser?: {
    id: string
    firstname: string
    lastname: string
    email: string
  }
  impersonator?: {
    id: string
    firstname: string
    lastname: string
    email: string
  }
}

const fetchImpersonationStatus = async (): Promise<ImpersonationStatus> => {
  const response = await fetch('/api/auth/impersonation-status')

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du statut d'usurpation")
  }

  return response.json()
}

export const useImpersonationStatus = () => {
  return useQuery({
    queryKey: ['impersonation-status'],
    queryFn: fetchImpersonationStatus,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
  })
}
