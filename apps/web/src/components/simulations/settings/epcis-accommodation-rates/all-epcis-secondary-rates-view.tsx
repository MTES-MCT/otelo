'use client'

import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateAllSecondaryAccommodationRateInput } from '~/components/simulations/settings/create-all-secondary-accommodation-rate-input'
import { AggregatedSecondaryParcsComparisonChart } from './aggregated-secondary-parc-comparison-chart'

export const AllEpcisSecondaryRatesView: FC = () => {
  const { defaultRates } = useEpcisRates()

  // Calculate average secondary accommodation rate across all EPCIs
  const epciIds = Object.keys(defaultRates)
  const averageTxRS = epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + defaultRates[epciId].txRS, 0) / epciIds.length : 0

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
        <span className="fr-text-mention--grey">
          Le taux moyen observé sur l'ensemble du territoire s'élève à <strong>{(averageTxRS * 100).toFixed(2)} %</strong>.
        </span>
        <div className="fr-flex fr-direction-column fr-flex-gap-6v fr-justify-content-space-between">
          <CreateAllSecondaryAccommodationRateInput />
          <AggregatedSecondaryParcsComparisonChart />
        </div>
      </div>
    </div>
  )
}
