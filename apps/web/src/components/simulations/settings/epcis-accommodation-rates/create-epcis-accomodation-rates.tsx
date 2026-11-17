'use client'

import { TEpcisAccommodationRates } from '@otelo/shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { CreateVacancyAccommodationRatesInput } from '~/components/simulations/settings/create-vacancy-accommodation-rates-input'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import { AllEpcisRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/all-epcis-rates-view'
import ParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/parc-comparison-charts'
import { RatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/rates-toggle-switch'
import { LongTermVacancyQuestion } from '~/components/simulations/settings/long-term-vacancy-texts'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { ChoiceHelpButton } from '~/components/simulations/tutorial/tutorial-button'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useDefaultLongTermVacancyReduction } from '~/hooks/use-default-long-term-vacancy-reduction'
import { useCreationPeakYears } from '~/hooks/use-simulation-peak-years'
import styles from './epcis-accommodation-rates.module.css'

interface CreateEpcisAccomodationRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  epciName: string
  rates: TEpcisAccommodationRates
  millesime: string
}

const TabChildren: FC<TabChildrenProps> = ({ epci, epciName, rates, millesime }) => {
  const { peakYears, projection, isLoading } = useCreationPeakYears()
  const epciRates = rates?.[epci]
  const epciPeakYear = peakYears[epci] ?? null
  const isPeakBeforeProjection = epciPeakYear !== null && projection !== null && epciPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && millesime !== null && epciPeakYear! <= Number(millesime)
  const targetYear = isPeakBeforeProjection ? epciPeakYear : projection

  if (!epciRates) return null
  if (isLoading) return <LoadingSpinner />

  return (
    <>
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-6v">
          <ChoiceHelpButton />
          <PeakYearHorizonAlert peakYear={epciPeakYear ?? null} projection={projection} millesime={millesime ? Number(millesime) : null} />
          {!isLockedByMillesime && (
            <>
              <LongTermVacancyQuestion
                millesime={millesime}
                territoryLabel={epciName}
                observedRate={Number(epciRates.longTermVacancyRate)}
                targetYear={targetYear}
              />
              <div {...tutorialAnchor('long-term-vacancy-input')}>
                <CreateVacancyAccommodationRatesInput epci={epci} epciName={epciName} />
              </div>
            </>
          )}
        </div>
      </div>
      {!isLockedByMillesime && (
        <div
          className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between"
          {...tutorialAnchor('vacancy-parc-chart')}
        >
          <ParcsComparisonCharts epci={epci} targetYear={targetYear} withSecondaryAccommodation={false} />
        </div>
      )}
    </>
  )
}

export const CreateEpcisAccommodationRates: FC<CreateEpcisAccomodationRatesProps> = ({ epcis }) => {
  const epcisCodes = epcis.map((epci) => epci.code)
  const [millesime] = useQueryState('millesime', parseAsString)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, millesime ?? undefined)
  const [ratesMode] = useQueryState('vacantRates', parseAsString)
  const { minPeakYear, projection } = useCreationPeakYears()

  // Le défaut s'applique à tous les EPCI, y compris ceux dont l'onglet n'est jamais ouvert.
  useDefaultLongTermVacancyReduction()

  const isPeakBeforeProjection = minPeakYear !== null && projection !== null && minPeakYear < projection

  if (!rates) return null

  const isAllMode = ratesMode === 'all' && !isPeakBeforeProjection

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RatesToggleSwitch disabled={isPeakBeforeProjection} />
      </div>
      {isAllMode ? (
        <AllEpcisRatesView />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => (
            <TabChildren
              epci={epciCode}
              epciName={epcis.find((epci) => epci.code === epciCode)?.name ?? epciCode}
              rates={rates}
              millesime={millesime!}
            />
          )}
        />
      )}
    </>
  )
}
