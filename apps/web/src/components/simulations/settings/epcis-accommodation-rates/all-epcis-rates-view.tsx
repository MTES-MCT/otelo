'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateAllEpcisAccommodationRange } from '~/components/simulations/settings/create-all-epcis-accommodation-range'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { useCreationPeakYears } from '~/hooks/use-simulation-peak-years'
import { AggregatedParcsComparisonChart } from './aggregated-parc-comparison-chart'

export const AllEpcisRatesView: FC = () => {
  const [millesime] = useQueryState('millesime', parseAsString)
  const { defaultRates } = useEpcisRates()
  const { minPeakYear, projection } = useCreationPeakYears()

  const millesimeNum = millesime ? Number(millesime) : null
  const isPeakBeforeProjection = minPeakYear !== null && projection !== null && minPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && millesimeNum !== null && minPeakYear <= millesimeNum
  const targetYear = isPeakBeforeProjection ? minPeakYear : projection

  // Calculate aggregated long-term vacancy rate: Part_VLD × Taux_FILOCOM_BH
  const epciIds = Object.keys(defaultRates)
  const totalLongTermVacant = epciIds.reduce((sum, id) => sum + defaultRates[id].longTermVacantCount, 0)
  const totalVacant = epciIds.reduce((sum, id) => sum + defaultRates[id].totalVacantCount, 0)
  const partVacanceLongueDuree = totalVacant > 0 ? totalLongTermVacant / totalVacant : 0

  const totalParctot = epciIds.reduce((sum, id) => sum + defaultRates[id].parctot, 0)
  const tauxVacanceBH =
    totalParctot > 0 ? epciIds.reduce((sum, id) => sum + defaultRates[id].vacancyRate * defaultRates[id].parctot, 0) / totalParctot : 0

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
                  taux moyen en {millesime} sur l'ensemble du territoire est de <strong>{(averageLongTermRate * 100).toFixed(2)}%</strong>.
                </p>
              </div>
              <CreateAllEpcisAccommodationRange targetYear={targetYear} />
              <div className="fr-flex fr-direction-column fr-flex-gap-2v">
                <div className="fr-flex fr-flex-gap-2v">
                  <span className="fr-text--medium">Vacance de courte durée</span>
                  <Badge>Non modifiable</Badge>
                </div>
                <p>
                  Elle regroupe les logements temporairement vacants (rotation locative, mise en vente, travaux), nécessaires au bon
                  fonctionnement du marché du logement. Otelo considère le taux de vacance courte durée observé en {millesime} comme{' '}
                  <span className="fr-text--bold">stable</span> et ne propose pas de le modifier.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {!isLockedByMillesime && (
        <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
          <AggregatedParcsComparisonChart targetYear={targetYear} />
        </div>
      )}
    </div>
  )
}
