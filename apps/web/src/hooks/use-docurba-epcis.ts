import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DocurbaEpciData } from './use-docurba-epci'

export const useDocurbaEpcis = (codes: string[]) => {
  const queryClient = useQueryClient()
  const sortedKey = [...codes].sort().join(',')

  return useQuery<Record<string, DocurbaEpciData | null>>({
    queryKey: ['docurba-epcis', sortedKey],
    queryFn: async () => {
      const res = await fetch(`/api/docurba/epcis?codes=${encodeURIComponent(sortedKey)}`)
      if (res.status === 204 || !res.ok) return Object.fromEntries(codes.map((c) => [c, null]))
      const data: Record<string, DocurbaEpciData | null> = await res.json()

      for (const [code, result] of Object.entries(data)) {
        if (result !== null) queryClient.setQueryData(['docurba-epci', code], result)
      }

      if (Object.values(data).some((v) => v === null)) throw new Error('pending')

      return data
    },
    retry: 6,
    retryDelay: 5000,
    staleTime: 60 * 60 * 1000,
  })
}
