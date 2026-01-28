'use client'

import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateAllRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/create-all-restructuration-disparition-rates-input'

export const AllEpcisRestructurationRatesView: FC = () => {
  const { defaultRates } = useEpcisRates()
  const epciIds = Object.keys(defaultRates)

  // Calculate average rates across all EPCIs
  const averageRestructuringRate =
    epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + (defaultRates[epciId]?.restructuringRate || 0), 0) / epciIds.length : 0

  const averageDisappearanceRate =
    epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + (defaultRates[epciId]?.disappearanceRate || 0), 0) / epciIds.length : 0

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-justify-content-space-between">
        <span className="fr-text-mention--grey fr-mb-3v">
          Par défaut, Otelo vous propose de reconduire les taux annuels mesurés entre 2015 et 2021. Les taux moyens observés sur l'ensemble
          du territoire sont de <strong>{(averageRestructuringRate * 100).toFixed(2)} %</strong> pour la restructuration et{' '}
          <strong>{(averageDisappearanceRate * 100).toFixed(2)} %</strong> pour la disparition.
        </span>
        <CreateAllRestructurationDisparitionRatesInput />
      </div>
    </div>
  )
}
