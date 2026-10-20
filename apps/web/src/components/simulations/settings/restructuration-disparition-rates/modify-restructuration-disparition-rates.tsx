'use client'

import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { EpciTabs } from '~/components/simulations/settings/epci-tabs'
import styles from '~/components/simulations/settings/epcis-accommodation-rates/epcis-accommodation-rates.module.css'
import { ModifyAllEpcisRestructurationRatesView } from '~/components/simulations/settings/restructuration-disparition-rates/modify-all-epcis-restructuration-rates-view'
import { ModifyRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/modify-restructuration-disparition-rates.input'
import { RestructurationRatesToggleSwitch } from '~/components/simulations/settings/restructuration-disparition-rates/restructuration-rates-toggle-switch'

interface ModifyRestructurationDisparitionRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  epciName: string
  projection: number
  rates: TEpcisAccommodationRates
  observedPeriodLabel: string
}

const getObservedRatesPeriodLabel = (millesime?: string): string => {
  const year = Number(millesime)
  return Number.isFinite(year) && year >= 2022 ? '2015 et 2022' : '2015 et 2021'
}

const TabChildren: FC<TabChildrenProps> = ({ epci, epciName, projection, rates, observedPeriodLabel }) => {
  const epciRates = rates?.[epci]
  if (!epciRates) return null

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-justify-content-space-between">
      {/* Introduit le renouvellement urbain plutôt que d'inciter à reconduire les taux par défaut. */}
      <p className="fr-mb-1v">
        Entre {observedPeriodLabel}, le parc de logements de {epciName} a évolué sous l&apos;effet des démolitions, fusions, divisions et
        changements d&apos;usage. Quel rythme anticipez-vous d&apos;ici {projection} ?
      </p>

      <ModifyRestructurationDisparitionRatesInput epci={epci} />
    </div>
  )
}

export const ModifyRestructurationDisparitionRates: FC<ModifyRestructurationDisparitionRatesProps> = ({ epcis }) => {
  const { simulationSettings } = useSimulationSettings()
  const rates = simulationSettings.epciScenarios
  const [ratesMode] = useQueryState('restructurationRates', parseAsString)
  const observedPeriodLabel = getObservedRatesPeriodLabel(simulationSettings.millesime)

  if (!rates) return null

  const isAllMode = ratesMode === 'all'

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RestructurationRatesToggleSwitch />
      </div>
      {isAllMode ? (
        <ModifyAllEpcisRestructurationRatesView />
      ) : (
        <EpciTabs
          epcis={epcis}
          renderTab={(epciCode) => (
            <TabChildren
              epci={epciCode}
              epciName={epcis.find((epci) => epci.code === epciCode)?.name ?? epciCode}
              projection={simulationSettings.projection}
              rates={rates}
              observedPeriodLabel={observedPeriodLabel}
            />
          )}
        />
      )}
    </>
  )
}
