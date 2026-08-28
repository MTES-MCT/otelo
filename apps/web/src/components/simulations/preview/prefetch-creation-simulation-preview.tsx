'use client'

import { useQueryClient } from '@tanstack/react-query'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { postPreview } from '~/hooks/use-simulation-preview'

export const PrefetchCreationSimulationPreview = () => {
  const queryClient = useQueryClient()
  const { payload, enabled } = useCreationPreviewPayload()
  const [{ omphale, population }] = useQueryStates({ omphale: parseAsString, population: parseAsString })

  // Même règle que la carte : sans projection choisie, l'API répondrait sur ses scénarios par
  // défaut, et on préchargerait un chiffre que l'on refuse d'afficher.
  const hasDemographicChoice = Boolean(population && omphale)

  useEffect(() => {
    if (!enabled || !hasDemographicChoice) return
    queryClient.prefetchQuery({
      queryKey: ['simulation-preview', payload],
      queryFn: () => postPreview(payload),
      staleTime: 30_000,
    })
  }, [payload, enabled, hasDemographicChoice, queryClient])

  return null
}
