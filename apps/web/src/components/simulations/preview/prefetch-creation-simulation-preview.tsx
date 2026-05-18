'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { postPreview } from '~/hooks/use-simulation-preview'

export const PrefetchCreationSimulationPreview = () => {
  const queryClient = useQueryClient()
  const { payload, enabled } = useCreationPreviewPayload()

  useEffect(() => {
    if (!enabled) return
    queryClient.prefetchQuery({
      queryKey: ['simulation-preview', payload],
      queryFn: () => postPreview(payload),
      staleTime: 30_000,
    })
  }, [payload, enabled, queryClient])

  return null
}
