'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { CreatePeakYearHorizonAlert } from '~/components/simulations/settings/create-peak-year-horizon-alert'
import { CreateVacancyAccommodationRatesInput } from '~/components/simulations/settings/create-vacancy-accommodation-rates-input'
import { AllEpcisRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/all-epcis-rates-view'
import ParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/parc-comparison-charts'
import { RatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/rates-toggle-switch'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
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
  const { payload, enabled } = useCreationPreviewPayload()
  const { data: previewData, isLoading } = useSimulationPreview(payload, { enabled })
  const epciRates = rates?.[epci]
  const peakYearValues = previewData?.flowRequirement?.epcis?.map((e) => e.data.peakYear).filter(Boolean) ?? []
  const minPeakYear = peakYearValues.length > 0 ? Math.min(...peakYearValues) : null
  const projection = payload.scenario?.projection ?? null
  const isPeakBeforeProjection = minPeakYear !== null && projection !== null && minPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && millesime !== null && minPeakYear! <= Number(millesime)

  if (!epciRates) return null
  if (isLoading) return <LoadingSpinner />

  return (
    <>
      <div className="fr-mb-2w">
        <div className="fr-flex fr-direction-column fr-flex-gap-8v">
          <CreatePeakYearHorizonAlert />
          {!isLockedByMillesime && (
            <>
              <div className="fr-flex fr-direction-column fr-flex-gap-2v">
                <span className="fr-text--medium">Vacance de longue durée</span>
                <p className="fr-mb-0">
                  Elle désigne les logements vacants depuis plus de deux ans. Elle représente un réservoir de logements mobilisables. Le
                  taux en {millesime} sur ce territoire est de <strong>{(Number(epciRates.longTermVacancyRate) * 100).toFixed(2)}%</strong>.
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
            </>
          )}
        </div>
      </div>
      {!isLockedByMillesime && (
        <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
          <ParcsComparisonCharts epci={epci} withSecondaryAccommodation={false} />
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
