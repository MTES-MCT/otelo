'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { CreateVacancyAccommodationRatesInput } from '~/components/simulations/settings/create-vacancy-accommodation-rates-input'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import { AllEpcisRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/all-epcis-rates-view'
import ParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/parc-comparison-charts'
import { RatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/rates-toggle-switch'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
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
  rates: TEpcisAccommodationRates
  millesime: string
}

const TabChildren: FC<TabChildrenProps> = ({ epci, rates, millesime }) => {
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
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <PeakYearHorizonAlert peakYear={epciPeakYear ?? null} projection={projection} millesime={millesime ? Number(millesime) : null} />
          {!isLockedByMillesime && (
            <>
              <div className="fr-flex fr-direction-column fr-flex-gap-2v" {...tutorialAnchor('long-term-vacancy-rate')}>
                <span className="fr-text--medium">Vacance de longue durée</span>
                <p className="fr-mb-0">
                  Elle désigne les logements vacants depuis plus de deux ans. Elle représente un réservoir de logements mobilisables. Le
                  taux en {millesime} sur ce territoire est de <strong>{(Number(epciRates.longTermVacancyRate) * 100).toFixed(2)}%</strong>.
                </p>
              </div>
              <CreateVacancyAccommodationRatesInput epci={epci} />
              <div className="fr-flex fr-direction-column fr-flex-gap-2v" {...tutorialAnchor('short-term-vacancy-rate')}>
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
        <EpciTabs epcis={epcis} renderTab={(epciCode) => <TabChildren epci={epciCode} rates={rates} millesime={millesime!} />} />
      )}
    </>
  )
}
