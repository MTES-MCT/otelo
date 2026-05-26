import { useQuery } from '@tanstack/react-query'

export type DocurbaEpciData = {
  communeCode: string
  scotName: string | null
  documentType: string | null
  approvalYear: string | null
  procedureInProgress: { type: string; documentType: string } | null
}

export const useDocurbaEpci = (epciCode: string) => {
  return useQuery<DocurbaEpciData | null>({
    queryFn: async () => {
      const res = await fetch(`/api/docurba/epci/${epciCode}`)
      if (res.status === 204 || !res.ok) return null
      const data: DocurbaEpciData | null = await res.json()
      // null = cache froid côté NestJS, on relance pour récupérer le résultat en arrière-plan
      if (!data) throw new Error('pending')
      return data
    },
    queryKey: ['docurba-epci', epciCode],
    retry: 6,
    retryDelay: 5000,
    staleTime: 60 * 60 * 1000,
  })
}
