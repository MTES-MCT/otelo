import { useQuery } from '@tanstack/react-query'

export type DocurbaEpciData = {
  communeCode: string
  scotName: string | null
  documentType: string | null
  approvalYear: string | null
  procedureInProgress: { type: string; documentType: string } | null
}

// Le service NestJS renvoie `null` au bout de 3s si son cache est froid, et poursuit le calcul
// en arrière-plan. On réinterroge donc tant qu'il reste des EPCI sans réponse, sans jamais
// masquer ceux déjà résolus (un EPCI réellement absent de Docurba reste `null` indéfiniment).
const MAX_POLLS = 6
const POLL_INTERVAL_MS = 5000

export const useDocurbaEpcis = (codes: string[]) => {
  const sortedKey = [...codes].sort().join(',')

  return useQuery<Record<string, DocurbaEpciData | null>>({
    enabled: codes.length > 0,
    queryKey: ['docurba-epcis', sortedKey],
    queryFn: async () => {
      const res = await fetch(`/api/docurba/epcis?codes=${encodeURIComponent(sortedKey)}`)
      if (res.status === 204 || !res.ok) return Object.fromEntries(codes.map((c) => [c, null]))
      return res.json()
    },
    refetchInterval: ({ state }) => {
      if (!state.data || state.dataUpdateCount >= MAX_POLLS) return false
      return Object.values(state.data).some((value) => value === null) ? POLL_INTERVAL_MS : false
    },
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 60 * 1000,
  })
}
