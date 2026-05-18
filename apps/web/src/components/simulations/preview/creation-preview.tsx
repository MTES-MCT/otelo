'use client'

import { FC } from 'react'
import { SimulationPreview } from '~/components/simulations/preview/simulation-preview'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'

export const CreationPreview: FC = () => {
  const { payload, enabled } = useCreationPreviewPayload()
  return <SimulationPreview payload={payload} enabled={enabled} />
}
