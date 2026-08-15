'use client'

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { buildEstimationBreakdown } from '~/utils/estimation-breakdown'
import { EstimationCard } from './estimation-card'

export const CreationEstimationCard: FC = () => {
  const [{ projection, epciGroupName }] = useQueryStates({ projection: parseAsInteger, epciGroupName: parseAsString })
  const { payload, enabled } = useCreationPreviewPayload()
  const { data, isFetching, error } = useSimulationPreview(payload, { enabled })

  // Tant qu'aucun résultat n'est arrivé — et en cas d'échec — on n'affiche rien : un paramétrage en
  // cours n'a pas à porter un message d'erreur technique.
  if (error || !data) {
    return null
  }

  return (
    <EstimationCard
      breakdown={buildEstimationBreakdown(data)}
      projection={projection}
      territoryLabel={epciGroupName}
      isStale={isFetching}
    />
  )
}
