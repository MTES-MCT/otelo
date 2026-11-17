'use client'

import { TEpcisAccommodationRates } from '@otelo/shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import { ModifyAllEpcisSecondaryRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/modify-all-epcis-secondary-rates-view'
import ModifyParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/modify-parc-comparison-charts'
import { SecondaryRatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/secondary-rates-toggle-switch'
import { ModifySecondaryAccommodationRateInput } from '~/components/simulations/settings/modify-accommodation-rate-input'
import { PeakYearHorizonAlert } from '~/components/simulations/settings/peak-year-horizon-alert'
import { SecondaryResidenceObservation, SecondaryResidenceReadingKey } from '~/components/simulations/settings/secondary-residence-texts'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useModifyPeakYears } from '~/hooks/use-simulation-peak-years'
import styles from './epcis-accommodation-rates.module.css'

interface ModifyEpcisSecondaryAccomodationRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  epciName: string
  rates: TEpcisAccommodationRates
}

const TabChildren: FC<TabChildrenProps> = ({ epci, epciName, rates }) => {
  const { simulationSettings } = useSimulationSettings()
  const { peakYears, isLoading } = useModifyPeakYears()
  const epciRates = rates?.[epci]
  const targetTxRs = simulationSettings.epciScenarios[epci]?.txRs

  const epciPeakYear = peakYears[epci]
  const isPeakBeforeProjection = epciPeakYear !== undefined && epciPeakYear < simulationSettings.projection
  const isLockedByMillesime = isPeakBeforeProjection && epciPeakYear! <= Number(simulationSettings.millesime)
  const targetYear = isPeakBeforeProjection ? epciPeakYear : simulationSettings.projection

  if (!epciRates) return null
  if (isLoading) return <LoadingSpinner />

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-justify-content-space-between">
      <PeakYearHorizonAlert
        peakYear={epciPeakYear ?? null}
        projection={simulationSettings.projection}
        millesime={Number(simulationSettings.millesime)}
      />
      {!isLockedByMillesime && (
        <>
          <SecondaryResidenceObservation year={epciRates.vacancy.year} territoryLabel={epciName} observedRate={Number(epciRates.txRs)} />
          <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
            <ModifySecondaryAccommodationRateInput
              txKey="txRs"
              epci={epci}
              label={`Quel objectif de taux souhaitez-vous fixer pour l'horizon ${targetYear} ?`}
            />
            {targetTxRs !== undefined && (
              <SecondaryResidenceReadingKey
                territoryLabel={epciName}
                observedRate={Number(epciRates.txRs)}
                targetRate={targetTxRs}
                targetYear={targetYear}
              />
            )}
            <ModifyParcsComparisonCharts epci={epci} targetYear={targetYear} />
          </div>
        </>
      )}
    </div>
  )
}

export const ModifyEpcisSecondaryAccommodationRates: FC<ModifyEpcisSecondaryAccomodationRatesProps> = ({ epcis }) => {
  const { simulationSettings } = useSimulationSettings()
  const epcisCodes = epcis.map((epci) => epci.code)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, simulationSettings.millesime)
  const [ratesMode] = useQueryState('secondaryRates', parseAsString)
  const { minPeakYear } = useModifyPeakYears()

  const projection = simulationSettings.projection
  const isPeakBeforeProjection = minPeakYear !== null && minPeakYear < projection

  if (!rates) return null

  const isAllMode = ratesMode === 'all' && !isPeakBeforeProjection

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <SecondaryRatesToggleSwitch disabled={isPeakBeforeProjection} />
      </div>
      {isAllMode ? (
        <ModifyAllEpcisSecondaryRatesView epcis={epcis} />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => (
            <TabChildren epci={epciCode} epciName={epcis.find((epci) => epci.code === epciCode)?.name ?? epciCode} rates={rates} />
          )}
        />
      )}
    </>
  )
}
