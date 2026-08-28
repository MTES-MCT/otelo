'use client'
import { buildEstimationBreakdown, isEpciCountedInTotal } from '@shared'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useEstimationScope } from '~/hooks/use-estimation-scope'
import { useModifyPreviewPayload } from '~/hooks/use-modify-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { EstimationCard } from './estimation-card'

type ModificationEstimationCardProps = {
  /** Libellé du territoire, calculé côté serveur : le contexte de paramétrage ne porte que les taux. */
  territoryLabel?: string | null
  /** EPCI de la simulation, également fournis par le serveur, pour le sélecteur de portée. */
  epciOptions?: Array<{ code: string; name: string }>
}

export const ModificationEstimationCard: FC<ModificationEstimationCardProps> = ({ territoryLabel, epciOptions = [] }) => {
  const { simulationSettings } = useSimulationSettings()
  const payload = useModifyPreviewPayload()
  const { scopedEpciCode, setScope } = useEstimationScope(epciOptions.map((epci) => epci.code))

  // Le scénario vient de la base et est toujours renseigné ; la règle est la même qu'en création,
  // pour que la carte ne puisse jamais afficher une projection démographique implicite.
  const hasDemographicChoice = Boolean(simulationSettings.b2_scenario)
  const { data, isFetching, error } = useSimulationPreview(payload, { enabled: hasDemographicChoice })

  const commonProps = {
    epciCount: epciOptions.length,
    epciOptions,
    onScopeChange: setScope,
    projection: simulationSettings.projection ?? null,
    scopedEpciCode,
    territoryLabel,
  }

  if (!hasDemographicChoice) {
    return <EstimationCard breakdown={null} isStale={false} {...commonProps} />
  }

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
