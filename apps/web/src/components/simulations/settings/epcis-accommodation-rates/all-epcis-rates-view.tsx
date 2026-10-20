'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateAllEpcisAccommodationRange } from '~/components/simulations/settings/create-all-epcis-accommodation-range'
import { LongTermVacancyQuestion } from '~/components/simulations/settings/long-term-vacancy-texts'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { ChoiceHelpButton } from '~/components/simulations/tutorial/tutorial-button'
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
        <div className="fr-flex fr-direction-column fr-flex-gap-6v">
          <ChoiceHelpButton />
          <PeakYearHorizonAlert peakYear={minPeakYear} projection={projection} millesime={millesimeNum} />
          {!isLockedByMillesime && (
            <>
              <LongTermVacancyQuestion
                millesime={millesime}
                territoryLabel="l'ensemble du territoire"
                observedRate={averageLongTermRate}
                targetYear={targetYear}
              />
              <CreateAllEpcisAccommodationRange targetYear={targetYear} />
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
