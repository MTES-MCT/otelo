'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useModifyPreviewPayload } from '~/hooks/use-modify-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { buildEstimationBreakdown } from '~/utils/estimation-breakdown'
import { EstimationCard } from './estimation-card'

export const ModificationEstimationCard: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const payload = useModifyPreviewPayload()
  const { data, isFetching, error } = useSimulationPreview(payload)

  if (error || !data) {
    return null
  }

  return (
    <EstimationCard breakdown={buildEstimationBreakdown(data)} projection={simulationSettings.projection ?? null} isStale={isFetching} />
  )
}
