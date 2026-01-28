'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useQueryState } from 'nuqs'
import { FC, useEffect, useState } from 'react'
import { RateSettings, useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'

export const CreateAllEpcisAccommodationRange: FC = () => {
  const [projection] = useQueryState('projection')
  const { defaultRates, updateAllRates } = useEpcisRates()
  const [reductionPercent, setReductionPercent] = useState(15)

  // Apply default 15% reduction on mount
  useEffect(() => {
    applyReductionToAllEpcis(15)
  }, [])

  const applyReductionToAllEpcis = (rangeValue: number) => {
    const newRatesPerEpci: Record<string, Partial<RateSettings>> = {}

    Object.keys(defaultRates).forEach((epciId) => {
      const epciDefaultRate = defaultRates[epciId].longTermVacancyRate
      const reductionAmount = (rangeValue / 100) * epciDefaultRate
      newRatesPerEpci[epciId] = { longTermVacancyRate: epciDefaultRate - reductionAmount }
    })

    updateAllRates(newRatesPerEpci)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rangeValue = Number(e.target.value)
    setReductionPercent(rangeValue)
    applyReductionToAllEpcis(rangeValue)
  }

  return (
    <div className="fr-col-8">
      <Range
        label={`De quel pourcentage souhaitez-vous réduire ce taux d'ici ${projection} ?`}
        suffix="%"
        max={100}
        min={0}
        nativeInputProps={{
          onChange: handleChange,
          value: reductionPercent,
        }}
      />
    </div>
  )
}
