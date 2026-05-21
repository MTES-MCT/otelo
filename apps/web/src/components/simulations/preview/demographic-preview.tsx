'use client'

import { FC } from 'react'
import { SimulationPreview } from '~/components/simulations/preview/simulation-preview'
import { useModifyPreviewPayload } from '~/hooks/use-modify-preview-payload'

export const DemographicPreview: FC = () => {
  const payload = useModifyPreviewPayload()
  return <SimulationPreview payload={payload} />
}
