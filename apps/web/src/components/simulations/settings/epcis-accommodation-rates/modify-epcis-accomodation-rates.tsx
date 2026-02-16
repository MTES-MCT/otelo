'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { ModifyAllEpcisRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/modify-all-epcis-rates-view'
import ModifyParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/modify-parc-comparison-charts'
import { RatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/rates-toggle-switch'
import { ModifyVacancyAccommodationRatesInput } from '~/components/simulations/settings/modify-vacancy-accommodation-rates-input'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import styles from './epcis-accommodation-rates.module.css'

interface ModifyEpcisAccomodationRatesProps {
  epcis: Array<{ code: string; name: string; region: string }>
}

interface TabChildrenProps {
  epci: string
  rates: TEpcisAccommodationRates
}

const TabChildren: FC<TabChildrenProps> = ({ epci, rates }) => {
  const epciRates = rates?.[epci]
  if (!epciRates) return null

  return (
    <>
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <div className="fr-flex fr-direction-column fr-flex-gap-2v">
            <span className="fr-text--medium">Vacance de longue durée</span>
            <p className="fr-mb-0">
              Elle désigne les logements vacants depuis plus de deux ans. Elle représente un réservoir de logements mobilisables. Le taux en
              2021 sur ce territoire est de <strong>{(Number(epciRates.longTermVacancyRate) * 100).toFixed(2)}%</strong>.
            </p>
          </div>
          <ModifyVacancyAccommodationRatesInput epci={epci} epciRates={epciRates} />
          <div className="fr-flex fr-direction-column fr-flex-gap-2v">
            <div className="fr-flex fr-flex-gap-2v">
              <span className="fr-text--medium">Vacance de courte durée</span>
              <Badge>Non modifiable</Badge>
            </div>
            <p>
              Elle regroupe les logements temporairement vacants (rotation locative, mise en vente, travaux), nécessaires au bon
              fonctionnement du marché du logement. Otelo considère le taux de vacance courte durée observé en 2021 comme{' '}
              <span className="fr-text--bold">stable</span> et ne propose pas de le modifier.
            </p>
          </div>
        </div>
      </div>
      <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
        <ModifyParcsComparisonCharts epci={epci} withSecondaryAccommodation={false} />
      </div>
    </>
  )
}

export const ModifyEpcisAccommodationRates: FC<ModifyEpcisAccomodationRatesProps> = ({ epcis }) => {
  const epcisCodes = epcis.map((epci) => epci.code)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes)
  const [ratesMode] = useQueryState('vacantRates', parseAsString)

  if (!rates) return null

  const isAllMode = ratesMode === 'all'

  const tabs = epcis.map((epci) => ({
    content: <TabChildren epci={epci.code} rates={rates} />,
    iconId: 'ri-road-map-line' as RiIconClassName,
    label: epci.name,
  }))

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RatesToggleSwitch />
      </div>
      {isAllMode ? <ModifyAllEpcisRatesView /> : <Tabs classes={{ panel: 'fr-background-default--grey' }} tabs={tabs} />}
    </>
  )
}
