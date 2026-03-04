'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { CreateVacancyAccommodationRatesInput } from '~/components/simulations/settings/create-vacancy-accommodation-rates-input'
import { AllEpcisRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/all-epcis-rates-view'
import ParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/parc-comparison-charts'
import { RatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/rates-toggle-switch'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
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
  const epciRates = rates?.[epci]

  if (!epciRates) return null

  return (
    <>
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <div className="fr-flex fr-direction-column fr-flex-gap-2v">
            <span className="fr-text--medium">Vacance de longue durée</span>
            <p className="fr-mb-0">
              Elle désigne les logements vacants depuis plus de deux ans. Elle représente un réservoir de logements mobilisables. Le taux en{' '}
              {millesime} sur ce territoire est de <strong>{(Number(epciRates.longTermVacancyRate) * 100).toFixed(2)}%</strong>.
            </p>
          </div>
          <CreateVacancyAccommodationRatesInput epci={epci} />
          <div className="fr-flex fr-direction-column fr-flex-gap-2v">
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
        </div>
      </div>
      <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
        <ParcsComparisonCharts epci={epci} withSecondaryAccommodation={false} />
      </div>
    </>
  )
}

export const CreateEpcisAccommodationRates: FC<CreateEpcisAccomodationRatesProps> = ({ epcis }) => {
  const epcisCodes = epcis.map((epci) => epci.code)
  const [millesime] = useQueryState('millesime', parseAsString)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, millesime ?? undefined)
  const [ratesMode] = useQueryState('vacantRates', parseAsString)

  if (!rates) return null

  const isAllMode = ratesMode === 'all'

  const tabs = epcis.map((epci) => ({
    content: <TabChildren epci={epci.code} rates={rates} millesime={millesime!} />,
    iconId: 'ri-road-map-line' as RiIconClassName,
    label: epci.name,
  }))

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <RatesToggleSwitch />
      </div>
      {isAllMode ? <AllEpcisRatesView /> : <Tabs classes={{ panel: 'fr-background-default--grey' }} tabs={tabs} />}
    </>
  )
}
