'use client'
import { buildEstimationBreakdown, isEpciCountedInTotal } from '@shared'

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useEstimationScope } from '~/hooks/use-estimation-scope'
import { useEstimationTerritory } from '~/hooks/use-estimation-territory'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { EstimationCard } from './estimation-card'

export const CreationEstimationCard: FC = () => {
  const [{ omphale, population, projection }] = useQueryStates({
    omphale: parseAsString,
    population: parseAsString,
    projection: parseAsInteger,
  })
  const { epcis, payload, enabled } = useCreationPreviewPayload()
  const { epciOptions, groupLabel } = useEstimationTerritory(epcis)
  const { scopedEpciCode, setScope } = useEstimationScope(epcis)

  // Sans projection choisie, l'API retomberait sur ses scénarios par défaut : le chiffre affiché ne
  // serait pas celui de l'utilisateur. On ne le demande donc même pas.
  const hasDemographicChoice = Boolean(population && omphale)
  const { data, isFetching, error } = useSimulationPreview(payload, { enabled: enabled && hasDemographicChoice })

  const commonProps = {
    epciCount: epciOptions.length,
    epciOptions,
    onScopeChange: setScope,
    projection,
    scopedEpciCode,
    territoryLabel: groupLabel,
  }

  if (!hasDemographicChoice) {
    return <EstimationCard breakdown={null} isStale={false} {...commonProps} />
  }

  // Tant qu'aucun résultat n'est arrivé — et en cas d'échec — on n'affiche rien : un paramétrage en
  // cours n'a pas à porter un message d'erreur technique.
  if (error || !data) {
    return null
  }

  return (
    <EstimationCard
      breakdown={buildEstimationBreakdown(data, { epciCode: scopedEpciCode })}
      isScopedEpciExcluded={Boolean(scopedEpciCode) && !isEpciCountedInTotal(data, scopedEpciCode as string)}
      isStale={isFetching}
      {...commonProps}
    />
  )
}
