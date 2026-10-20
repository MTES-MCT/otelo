'use client'

import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateAllRestructurationDisparitionRatesInput } from '~/components/simulations/settings/restructuration-disparition-rates/create-all-restructuration-disparition-rates-input'
import { ChoiceHelpButton } from '~/components/simulations/tutorial/tutorial-button'

const getObservedRatesPeriodLabel = (millesime?: string): string => {
  const year = Number(millesime)
  return Number.isFinite(year) && year >= 2022 ? '2015 et 2022' : '2015 et 2021'
}

export const AllEpcisRestructurationRatesView: FC = () => {
  const { defaultRates } = useEpcisRates()
  const [millesime] = useQueryState('millesime', parseAsString)
  const [projection] = useQueryState('projection', parseAsInteger)
  const epciIds = Object.keys(defaultRates)
  const observedPeriodLabel = getObservedRatesPeriodLabel(millesime ?? undefined)

  // Calculate average rates across all EPCIs
  const averageRestructuringRate =
    epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + (defaultRates[epciId]?.restructuringRate || 0), 0) / epciIds.length : 0

  const averageDisappearanceRate =
    epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + (defaultRates[epciId]?.disappearanceRate || 0), 0) / epciIds.length : 0

  return (
    <div className="fr-p-4w shadow">
      <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-justify-content-space-between">
        <ChoiceHelpButton />
        {/* Introduit le renouvellement urbain plutôt que d'inciter à reconduire les taux par défaut. */}
        <p className="fr-mb-1v">
          Entre {observedPeriodLabel}, le parc de logements de votre territoire a évolué sous l&apos;effet des démolitions, fusions,
          divisions et changements d&apos;usage, à un rythme moyen de <strong>{(averageRestructuringRate * 100).toFixed(2)} %</strong> par
          an pour la restructuration et <strong>{(averageDisappearanceRate * 100).toFixed(2)} %</strong> pour la disparition. Quel rythme
          anticipez-vous d&apos;ici {projection} ?
        </p>
        <CreateAllRestructurationDisparitionRatesInput />
      </div>
    </div>
  )
}
