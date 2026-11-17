'use client'

import { TEpcisAccommodationRates } from '@otelo/shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateSecondaryAccommodationRateInput } from '~/components/simulations/settings/create-secondary-accommodation-rate-input'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import { AllEpcisSecondaryRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/all-epcis-secondary-rates-view'
import ParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/parc-comparison-charts'
import { SecondaryRatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/secondary-rates-toggle-switch'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { SecondaryResidenceObservation, SecondaryResidenceReadingKey } from '~/components/simulations/settings/secondary-residence-texts'
import { ChoiceHelpButton } from '~/components/simulations/tutorial/tutorial-button'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
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
  const { peakYears, projection: projectionNum, isLoading } = useCreationPeakYears()
  const { rates: targetRates } = useEpcisRates()
  const epciRates = rates?.[epci]
  const targetTxRS = targetRates[epci]?.txRS

  const epciPeakYear = peakYears[epci] ?? null
  const isPeakBeforeProjection = epciPeakYear !== null && projectionNum !== null && epciPeakYear < projectionNum
  const isLockedByMillesime = isPeakBeforeProjection && epciPeakYear! <= Number(millesime)
  const targetYear = isPeakBeforeProjection ? epciPeakYear : projectionNum

  if (!epciRates) return null
  if (isLoading) return <LoadingSpinner />

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-justify-content-space-between">
      <ChoiceHelpButton />
      <PeakYearHorizonAlert peakYear={epciPeakYear ?? null} projection={projectionNum} millesime={millesime ? Number(millesime) : null} />
      {!isLockedByMillesime && (
        <>
          <SecondaryResidenceObservation year={epciRates.vacancy.year} territoryLabel={epciName} observedRate={Number(epciRates.txRs)} />
          <div
            className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between"
            {...tutorialAnchor('secondary-rate')}
          >
            <CreateSecondaryAccommodationRateInput
              epci={epci}
              label={`Quel objectif de taux souhaitez-vous fixer pour l'horizon ${targetYear} ?`}
            />
            {targetTxRS !== undefined && (
              <SecondaryResidenceReadingKey
                territoryLabel={epciName}
                observedRate={Number(epciRates.txRs)}
                targetRate={targetTxRS}
                targetYear={targetYear}
              />
            )}
            <ParcsComparisonCharts epci={epci} targetYear={targetYear} />
          </div>
        </>
      )}
    </div>
  )
}

export const CreateEpcisSecondaryAccommodationRates: FC<CreateEpcisAccomodationRatesProps> = ({ epcis }) => {
  const epcisCodes = epcis.map((epci) => epci.code)
  const [millesime] = useQueryState('millesime', parseAsString)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, millesime ?? undefined)
  const [ratesMode] = useQueryState('secondaryRates', parseAsString)
  const { minPeakYear, projection } = useCreationPeakYears()

  const isPeakBeforeProjection = minPeakYear !== null && projection !== null && minPeakYear < projection

  if (!rates) return null

  const isAllMode = ratesMode === 'all' && !isPeakBeforeProjection

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <SecondaryRatesToggleSwitch disabled={isPeakBeforeProjection} />
      </div>
      {isAllMode ? (
        <AllEpcisSecondaryRatesView epcis={epcis} />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => (
            <TabChildren
              epci={epciCode}
              epciName={epcis.find((epci) => epci.code === epciCode)?.name ?? epciCode}
              rates={rates}
              millesime={millesime ?? ''}
            />
          )}
        />
      )}
    </>
  )
}
