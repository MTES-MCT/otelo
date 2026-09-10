'use client'

import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import styles from '~/components/simulations/settings/epcis-accommodation-rates/epcis-accommodation-rates.module.css'
import { AllEpcisRestructurationRatesView } from '~/components/simulations/settings/restructuration-disparition-rates/all-epcis-restructuration-rates-view'
import { CreateRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/create-restructuration-disparition-rates.input'
import { RestructurationRatesToggleSwitch } from '~/components/simulations/settings/restructuration-disparition-rates/restructuration-rates-toggle-switch'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { getObservedRatesPeriodLabel } from '~/utils/projection'

interface CreateRestructurationDisparitionRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  rates: TEpcisAccommodationRates
  observedPeriodLabel: string
}

const TabChildren: FC<TabChildrenProps> = ({ epci, rates, observedPeriodLabel }) => {
  const epciRates = rates?.[epci]
  if (!epciRates) return null

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
      <span className="fr-text-mention--grey fr-mb-5v" {...tutorialAnchor('observed-rates-note')}>
        Par défaut, Otelo vous propose de reconduire les taux annuels mesurés entre {observedPeriodLabel}.
      </span>
      <CreateRestructurationDisparitionRatesInput epci={epci} />
    </div>
  )
}

export const CreateRestructurationDisparitionRates: FC<CreateRestructurationDisparitionRatesProps> = ({ epcis }) => {
  const epcisCodes = epcis.map((epci) => epci.code)
  const [millesime] = useQueryState('millesime', parseAsString)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, millesime ?? undefined)
  const [ratesMode] = useQueryState('restructurationRates', parseAsString)
  const observedPeriodLabel = getObservedRatesPeriodLabel(millesime ?? undefined)

  if (!rates) return null

  const isAllMode = ratesMode === 'all'

  return (
    <>
      <div
        className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}
        {...tutorialAnchor('restructuration-toggle')}
      >
        <RestructurationRatesToggleSwitch />
      </div>
      {isAllMode ? (
        <AllEpcisRestructurationRatesView />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => <TabChildren epci={epciCode} rates={rates} observedPeriodLabel={observedPeriodLabel} />}
        />
      )}
    </>
  )
}
