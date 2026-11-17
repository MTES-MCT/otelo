import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { TResults } from '~/schemas/results'

export interface SimulationPreviewPayload {
  simulationId?: string
  epcis?: string[]
  scenario?: Record<string, unknown>
  epciScenarios?: Record<string, Record<string, unknown>>
}

export const postPreview = async (payload: SimulationPreviewPayload): Promise<TResults> => {
  const response = await fetch('/api/simulations/preview', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Preview failed with status ${response.status}`)
  }
  return response.json()
}

export const useSimulationPreview = (payload: SimulationPreviewPayload, options: { enabled?: boolean; debounceMs?: number } = {}) => {
  const { enabled = true, debounceMs = 400 } = options
  const [debouncedPayload] = useDebounce(payload, debounceMs)

  const queryKey = useMemo(() => ['simulation-preview', debouncedPayload], [debouncedPayload])

  const hasInput = Boolean(debouncedPayload.simulationId) || (debouncedPayload.epcis?.length ?? 0) > 0

  return useQuery<TResults>({
    queryKey,
    queryFn: () => postPreview(debouncedPayload),
    enabled: enabled && hasInput,
    // Chaque paramètre modifié change la queryKey : sans ça, `data` repasserait à undefined à chaque
    // frappe et l'aperçu clignoterait. On garde la dernière valeur connue pendant le recalcul.
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: false,
  })
}
