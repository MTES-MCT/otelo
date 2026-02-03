'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { ModifyAllRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/modify-all-restructuration-disparition-rates-input'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

export const ModifyAllEpcisRestructurationRatesView: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds)

  // Calculate average rates across all EPCIs
  const averageRestructuringRate =
    originalRatesData && epciIds.length > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.restructuringRate || 0), 0) / epciIds.length
      : 0

  const averageDisappearanceRate =
    originalRatesData && epciIds.length > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.disappearanceRate || 0), 0) / epciIds.length
      : 0

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
        <span className="fr-text-mention--grey fr-mb-3v">
          Par défaut, Otelo vous propose de reconduire les taux annuels mesurés entre 2015 et 2021. Les taux moyens observés sur l'ensemble
          du territoire sont de <strong>{(averageRestructuringRate * 100).toFixed(2)} %</strong> pour la restructuration et{' '}
          <strong>{(averageDisappearanceRate * 100).toFixed(2)} %</strong> pour la disparition.
        </span>
        <ModifyAllRestructurationDisparitionRatesInput />
      </div>{' '}
    </div>
  )
}
