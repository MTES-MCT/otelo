'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { ModifyAllRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/modify-all-restructuration-disparition-rates-input'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

const getObservedRatesPeriodLabel = (millesime?: string): string => {
  const year = Number(millesime)
  return Number.isFinite(year) && year >= 2022 ? '2015 et 2022' : '2015 et 2021'
}

export const ModifyAllEpcisRestructurationRatesView: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds, simulationSettings.millesime)
  const observedPeriodLabel = getObservedRatesPeriodLabel(simulationSettings.millesime)

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
      <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-justify-content-space-between">
        {/* Introduit le renouvellement urbain plutôt que d'inciter à reconduire les taux par défaut. */}
        <p className="fr-mb-1v">
          Entre {observedPeriodLabel}, le parc de logements de votre territoire a évolué sous l&apos;effet des démolitions, fusions,
          divisions et changements d&apos;usage, à un rythme moyen de <strong>{(averageRestructuringRate * 100).toFixed(2)} %</strong> par
          an pour la restructuration et <strong>{(averageDisappearanceRate * 100).toFixed(2)} %</strong> pour la disparition. Quel rythme
          anticipez-vous d&apos;ici {simulationSettings.projection} ?
        </p>
        <ModifyAllRestructurationDisparitionRatesInput />
      </div>
    </div>
  )
}
