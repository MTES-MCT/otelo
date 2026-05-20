'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
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
              <div className="fr-flex fr-direction-column fr-flex-gap-2v">
                <span className="fr-text--medium">Vacance de longue durée</span>
                <p className="fr-mb-0">
                  Elle désigne les logements vacants depuis plus de deux ans. Elle représente un réservoir de logements mobilisables. Le
                  taux moyen en {simulationSettings.millesime} sur l'ensemble du territoire est de{' '}
                  <strong>{(averageLongTermRate * 100).toFixed(2)}%</strong>.
                </p>
              </div>
              <ModifyAllEpcisAccommodationRange targetYear={targetYear} />
              <div className="fr-flex fr-direction-column fr-flex-gap-2v">
                <div className="fr-flex fr-flex-gap-2v">
                  <span className="fr-text--medium">Vacance de courte durée</span>
                  <Badge>Non modifiable</Badge>
                </div>
                <p>
                  Elle regroupe les logements temporairement vacants (rotation locative, mise en vente, travaux), nécessaires au bon
                  fonctionnement du marché du logement. Otelo considère le taux de vacance courte durée observé en{' '}
                  {simulationSettings.millesime} comme <span className="fr-text--bold">stable</span> et ne propose pas de le modifier.
                </p>
              </div>
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
