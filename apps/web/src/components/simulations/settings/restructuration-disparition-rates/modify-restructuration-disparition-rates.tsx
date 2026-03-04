'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import styles from '~/components/simulations/settings/epcis-accommodation-rates/epcis-accommodation-rates.module.css'
import { ModifyAllEpcisRestructurationRatesView } from '~/components/simulations/settings/restructuration-disparition-rates/modify-all-epcis-restructuration-rates-view'
import { ModifyRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/modify-restructuration-disparition-rates.input'
import { RestructurationRatesToggleSwitch } from '~/components/simulations/settings/restructuration-disparition-rates/restructuration-rates-toggle-switch'

interface ModifyRestructurationDisparitionRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  rates: TEpcisAccommodationRates
  observedPeriodLabel: string
}

const getObservedRatesPeriodLabel = (millesime?: string): string => {
  const year = Number(millesime)
  return Number.isFinite(year) && year >= 2022 ? '2015 et 2022' : '2015 et 2021'
}

const TabChildren: FC<TabChildrenProps> = ({ epci, rates, observedPeriodLabel }) => {
  const epciRates = rates?.[epci]
  if (!epciRates) return null

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
      <span className="fr-text-mention--grey fr-mb-5v">
        Par défaut, Otelo vous propose de reconduire les taux annuels mesurés entre {observedPeriodLabel}.
      </span>

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

  const tabs = epcis.map((epci) => ({
    content: <TabChildren epci={epci.code} rates={rates} observedPeriodLabel={observedPeriodLabel} />,
    iconId: 'ri-road-map-line' as RiIconClassName,
    label: epci.name,
  }))

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RestructurationRatesToggleSwitch />
      </div>
      {isAllMode ? <ModifyAllEpcisRestructurationRatesView /> : <Tabs classes={{ panel: 'fr-background-default--grey' }} tabs={tabs} />}
    </>
  )
}
