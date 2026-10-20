'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC, useEffect, useState } from 'react'
import { RateSettings, useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { ReadingKey } from '~/components/ui/reading-key'
import { applyLongTermVacancyReduction, DEFAULT_LONG_TERM_VACANCY_REDUCTION_PERCENT } from '~/hooks/use-default-long-term-vacancy-reduction'

interface CreateAllEpcisAccommodationRangeProps {
  targetYear: number | null
}

export const CreateAllEpcisAccommodationRange: FC<CreateAllEpcisAccommodationRangeProps> = ({ targetYear }) => {
  const { defaultRates, updateAllRates } = useEpcisRates()
  const [reductionPercent, setReductionPercent] = useState(DEFAULT_LONG_TERM_VACANCY_REDUCTION_PERCENT)

  // Apply default reduction on mount
  useEffect(() => {
    applyReductionToAllEpcis(DEFAULT_LONG_TERM_VACANCY_REDUCTION_PERCENT)
  }, [])

  const applyReductionToAllEpcis = (rangeValue: number) => {
    const newRatesPerEpci: Record<string, Partial<RateSettings>> = {}

    Object.keys(defaultRates).forEach((epciId) => {
      const epciDefaultRate = defaultRates[epciId].longTermVacancyRate
      newRatesPerEpci[epciId] = { longTermVacancyRate: applyLongTermVacancyReduction(epciDefaultRate, rangeValue) }
    })

    updateAllRates(newRatesPerEpci)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rangeValue = Number(e.target.value)
    setReductionPercent(rangeValue)
    applyReductionToAllEpcis(rangeValue)
  }

  return (
    <>
      <div className="fr-col-12 fr-col-md-8">
        <Range
          // La question est posée juste au-dessus, en toutes lettres : le libellé ne sert qu'aux lecteurs d'écran.
          label={`Réduction du taux de vacance longue durée de chaque EPCI d'ici ${targetYear}`}
          classes={{ label: 'fr-sr-only' }}
          suffix="%"
          max={100}
          min={0}
          nativeInputProps={{
            onChange: handleChange,
            value: reductionPercent,
          }}
        />
      </div>
      <ReadingKey className="fr-mt-3w">
        Le taux de vacance longue durée de <strong>chaque EPCI</strong> sera réduit de <strong>{reductionPercent} %</strong> d&apos;ici{' '}
        {targetYear}, à partir de son propre taux observé.
      </ReadingKey>
    </>
  )
}
