'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { LongTermVacancyQuestion } from '~/components/simulations/settings/long-term-vacancy-texts'
import { ModifyAllEpcisAccommodationRange } from '~/components/simulations/settings/modify-all-epcis-accommodation-range'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useModifyPeakYears } from '~/hooks/use-simulation-peak-years'
import { ModifyAggregatedParcsComparisonChart } from './modify-aggregated-parc-comparison-chart'

export const ModifyAllEpcisRatesView: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds, simulationSettings.millesime)
  const { minPeakYear } = useModifyPeakYears()

  const millesimeNum = Number(simulationSettings.millesime)
  const projection = simulationSettings.projection
  const isPeakBeforeProjection = minPeakYear !== null && minPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && minPeakYear <= millesimeNum
  const targetYear = isPeakBeforeProjection ? minPeakYear : projection

  // Calculate aggregated long-term vacancy rate: Part_VLD × Taux_FILOCOM_BH
  const totalLongTermVacant = originalRatesData
    ? epciIds.reduce((sum, id) => sum + (originalRatesData[id]?.longTermVacantCount ?? 0), 0)
    : 0
  const totalVacant = originalRatesData ? epciIds.reduce((sum, id) => sum + (originalRatesData[id]?.totalVacantCount ?? 0), 0) : 0
  const partVacanceLongueDuree = totalVacant > 0 ? totalLongTermVacant / totalVacant : 0

  const totalParctot = originalRatesData ? epciIds.reduce((sum, id) => sum + (originalRatesData[id]?.urbanRenewal ?? 0), 0) : 0
  const tauxVacanceBH =
    totalParctot > 0 && originalRatesData
      ? epciIds.reduce((sum, id) => sum + (originalRatesData[id]?.vacancyRate ?? 0) * (originalRatesData[id]?.urbanRenewal ?? 0), 0) /
        totalParctot
      : 0

  const averageLongTermRate = partVacanceLongueDuree * tauxVacanceBH

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <PeakYearHorizonAlert peakYear={minPeakYear} projection={projection} millesime={millesimeNum} />
          {!isLockedByMillesime && (
            <>
              <LongTermVacancyQuestion
                millesime={simulationSettings.millesime}
                territoryLabel="l'ensemble du territoire"
                observedRate={averageLongTermRate}
                targetYear={targetYear}
              />
              <ModifyAllEpcisAccommodationRange targetYear={targetYear} />
            </>
          )}
        </div>
      </div>
      {!isLockedByMillesime && (
        <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
          <ModifyAggregatedParcsComparisonChart targetYear={targetYear} />
        </div>
      )}
    </div>
  )
}
