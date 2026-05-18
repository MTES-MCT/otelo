'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useModifyPreviewPayload } from '~/hooks/use-modify-preview-payload'
import { postPreview } from '~/hooks/use-simulation-preview'

export const PrefetchModifySimulationPreview = () => {
  const queryClient = useQueryClient()
  const payload = useModifyPreviewPayload()

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['simulation-preview', payload],
      queryFn: () => postPreview(payload),
      staleTime: 30_000,
    })
  }, [payload, queryClient])

  return null
}
