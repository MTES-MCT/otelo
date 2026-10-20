'use client'

import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import styles from '~/components/simulations/settings/epcis-accommodation-rates/epcis-accommodation-rates.module.css'
import { AllEpcisRestructurationRatesView } from '~/components/simulations/settings/restructuration-disparition-rates/all-epcis-restructuration-rates-view'
import { CreateRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/create-restructuration-disparition-rates.input'
import { RestructurationRatesToggleSwitch } from '~/components/simulations/settings/restructuration-disparition-rates/restructuration-rates-toggle-switch'
import { ChoiceHelpButton } from '~/components/simulations/tutorial/tutorial-button'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { getObservedRatesPeriodLabel } from '~/utils/projection'

interface CreateRestructurationDisparitionRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  epciName: string
  rates: TEpcisAccommodationRates
  observedPeriodLabel: string
}

const TabChildren: FC<TabChildrenProps> = ({ epci, epciName, rates, observedPeriodLabel }) => {
  const [projection] = useQueryState('projection', parseAsInteger)
  const epciRates = rates?.[epci]
  if (!epciRates) return null

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-justify-content-space-between">
      <ChoiceHelpButton />
      {/* Introduit le renouvellement urbain plutôt que d'inciter à reconduire les taux par défaut. */}
      <p className="fr-mb-1v" {...tutorialAnchor('observed-rates-note')}>
        Entre {observedPeriodLabel}, le parc de logements de {epciName} a évolué sous l&apos;effet des démolitions, fusions, divisions et
        changements d&apos;usage. Quel rythme anticipez-vous d&apos;ici {projection} ?
      </p>
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
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RestructurationRatesToggleSwitch />
      </div>
      {isAllMode ? (
        <AllEpcisRestructurationRatesView />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => (
            <TabChildren
              epci={epciCode}
              epciName={epcis.find((epci) => epci.code === epciCode)?.name ?? epciCode}
              rates={rates}
              observedPeriodLabel={observedPeriodLabel}
            />
          )}
        />
      )}
    </>
  )
}
