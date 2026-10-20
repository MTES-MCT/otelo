'use client'

import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import { ModifyAllEpcisRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/modify-all-epcis-rates-view'
import ModifyParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/modify-parc-comparison-charts'
import { RatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/rates-toggle-switch'
import { LongTermVacancyQuestion } from '~/components/simulations/settings/long-term-vacancy-texts'
import { ModifyVacancyAccommodationRatesInput } from '~/components/simulations/settings/modify-vacancy-accommodation-rates-input'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useModifyPeakYears } from '~/hooks/use-simulation-peak-years'
import styles from './epcis-accommodation-rates.module.css'

interface ModifyEpcisAccomodationRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  epciName: string
  rates: TEpcisAccommodationRates
  millesime: string
}

const TabChildren: FC<TabChildrenProps> = ({ epci, epciName, rates, millesime }) => {
  const { simulationSettings } = useSimulationSettings()
  const { peakYears, isLoading } = useModifyPeakYears()
  const epciRates = rates?.[epci]
  const epciPeakYear = peakYears[epci]
  const isPeakBeforeProjection = epciPeakYear !== undefined && epciPeakYear < simulationSettings.projection
  const isLockedByMillesime = isPeakBeforeProjection && epciPeakYear! <= Number(simulationSettings.millesime)
  const targetYear = isPeakBeforeProjection ? epciPeakYear : simulationSettings.projection

  if (!epciRates) return null
  if (isLoading) return <LoadingSpinner />

  return (
    <>
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <PeakYearHorizonAlert
            peakYear={epciPeakYear ?? null}
            projection={simulationSettings.projection}
            millesime={Number(simulationSettings.millesime)}
          />
          {!isLockedByMillesime && (
            <>
              <LongTermVacancyQuestion
                millesime={millesime}
                territoryLabel={epciName}
                observedRate={Number(epciRates.longTermVacancyRate)}
                targetYear={targetYear}
              />
              <ModifyVacancyAccommodationRatesInput epci={epci} epciName={epciName} epciRates={epciRates} />
            </>
          )}
        </div>
      </div>
      {!isLockedByMillesime && (
        <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
          <ModifyParcsComparisonCharts epci={epci} targetYear={targetYear} withSecondaryAccommodation={false} />
        </div>
      )}
    </>
  )
}

export const ModifyEpcisAccommodationRates: FC<ModifyEpcisAccomodationRatesProps> = ({ epcis }) => {
  const { simulationSettings } = useSimulationSettings()
  const epcisCodes = epcis.map((epci) => epci.code)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, simulationSettings.millesime)
  const [ratesMode] = useQueryState('vacantRates', parseAsString)
  const { minPeakYear } = useModifyPeakYears()

  const projection = simulationSettings.projection
  const isPeakBeforeProjection = minPeakYear !== null && minPeakYear < projection

  if (!rates) return null

  const isAllMode = ratesMode === 'all' && !isPeakBeforeProjection

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RatesToggleSwitch disabled={isPeakBeforeProjection} />
      </div>
      {isAllMode ? (
        <ModifyAllEpcisRatesView />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => (
            <TabChildren
              epci={epciCode}
              epciName={epcis.find((epci) => epci.code === epciCode)?.name ?? epciCode}
              rates={rates}
              millesime={simulationSettings.millesime}
            />
          )}
        />
      )}
    </>
  )
}
