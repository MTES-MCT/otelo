'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { ModifyAllSecondaryAccommodationRateInput } from '~/components/simulations/settings/modify-all-secondary-accommodation-rate-input'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { ModifyAggregatedSecondaryParcsComparisonChart } from './modify-aggregated-secondary-parc-comparison-chart'

export const ModifyAllEpcisSecondaryRatesView: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds)

  // Calculate average secondary accommodation rate across all EPCIs
  const averageTxRS =
    originalRatesData && epciIds.length > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.txRs || 0), 0) / epciIds.length
      : 0

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
        <span className="fr-text-mention--grey">
          Le taux moyen observé sur l'ensemble du territoire s'élève à <strong>{(averageTxRS * 100).toFixed(2)} %</strong>.
        </span>
        <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
          <ModifyAllSecondaryAccommodationRateInput />
          <ModifyAggregatedSecondaryParcsComparisonChart />
        </div>
      </div>
    </div>
  )
}
