'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { TEpcisAccommodationRates } from '@shared'
import classNames from 'classnames'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { CreatePeakYearHorizonAlert } from '~/components/simulations/settings/create-peak-year-horizon-alert'
import { CreateSecondaryAccommodationRateInput } from '~/components/simulations/settings/create-secondary-accommodation-rate-input'
import { AllEpcisSecondaryRatesView } from '~/components/simulations/settings/epcis-accommodation-rates/all-epcis-secondary-rates-view'
import ParcsComparisonCharts from '~/components/simulations/settings/epcis-accommodation-rates/parc-comparison-charts'
import { SecondaryRatesToggleSwitch } from '~/components/simulations/settings/epcis-accommodation-rates/secondary-rates-toggle-switch'
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

  const epciPeakYear = previewData?.flowRequirement?.epcis?.find((e) => e.code === epci)?.data.peakYear ?? null
  const projectionNum = (payload.scenario?.projection as number | null | undefined) ?? null
  const isPeakBeforeProjection = epciPeakYear !== null && projectionNum !== null && epciPeakYear < projectionNum
  const isLockedByMillesime = isPeakBeforeProjection && epciPeakYear! <= Number(millesime)
  const targetYear = isPeakBeforeProjection ? epciPeakYear : projectionNum

  if (!epciRates) return null
  if (isLoading) return <LoadingSpinner />

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
      <CreatePeakYearHorizonAlert />
      {!isLockedByMillesime && (
        <>
          <span className="fr-text-mention--grey">
            Le taux observé en {epciRates.vacancy.year} s'élève à <strong>{Number(epciRates.txRs * 100).toFixed(2)} %</strong>.
          </span>
          <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
            <CreateSecondaryAccommodationRateInput
              epci={epci}
              label={`Quel objectif de taux souhaitez-vous fixer pour l'horizon ${targetYear} ?`}
            />
            <ParcsComparisonCharts epci={epci} />
          </div>
        </>
      )}
    </div>
  )
}

export const CreateEpcisSecondaryAccommodationRates: FC<CreateEpcisAccomodationRatesProps> = ({ epcis }) => {
  const epcisCodes = epcis.map((epci) => epci.code)
  const [millesime] = useQueryState('millesime', parseAsString)
  const { data: rates } = useAccommodationRatesByEpci(epcisCodes, millesime ?? undefined)
  const [ratesMode] = useQueryState('secondaryRates', parseAsString)

  if (!rates) return null

  const isAllMode = ratesMode === 'all'

  const tabs = epcis.map((epci) => ({
    content: <TabChildren epci={epci.code} rates={rates} millesime={millesime ?? ''} />,
    iconId: 'ri-road-map-line' as RiIconClassName,
    label: epci.name,
  }))

  return (
    <>
      <div className={classNames('fr-px-md-4w fr-flex fr-pb-5w', styles.shadow, isAllMode && 'fr-border-bottom')}>
        <SecondaryRatesToggleSwitch />
      </div>
      {isAllMode ? <AllEpcisSecondaryRatesView epcis={epcis} /> : <Tabs classes={{ panel: 'fr-background-default--grey' }} tabs={tabs} />}
    </>
  )
}
