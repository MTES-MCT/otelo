'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
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
      <div className="fr-mb-2w">
        <Alert
          description="
            Le taux annuel de disparition correspond à la proportion du parc de logement qui a disparu durant une année. Cela peut
            correspondre à des logements démolis ou à des logements disparus du fait de fusions ou de changements d'usage (par exemple la
            transformation d'un logement en local d'activité)."
          severity="info"
          small
        />
        <Alert
          description="
            Les restructurations correspondent aux créations de nouveaux logements au sein du parc existant, à travers la division de logement ou de changement d'usages (par exemple la transformation de locaux d'activités en logements). Le taux de restructuration correspond au volume de logements créés par ces phénomènes de restructuration, rapporté à l'ensemble du parc."
          severity="info"
          small
        />
        <div className="fr-mt-4w">
          Par défaut, Otelo vous propose de reconduire les taux annuels mesurés entre 2015 et 2021. Les taux moyens observés sur l'ensemble
          du territoire sont de <strong>{(averageRestructuringRate * 100).toFixed(2)} %</strong> pour la restructuration et{' '}
          <strong>{(averageDisappearanceRate * 100).toFixed(2)} %</strong> pour la disparition.
        </div>
      </div>
      <ModifyAllRestructurationDisparitionRatesInput />
    </div>
  )
}
