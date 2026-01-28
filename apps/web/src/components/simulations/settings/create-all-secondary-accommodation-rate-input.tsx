'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { useQueryState } from 'nuqs'
import { FC, useEffect, useState } from 'react'
import { RateSettings, useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'

export const CreateAllSecondaryAccommodationRateInput: FC = () => {
  const [projection] = useQueryState('projection')
  const { defaultRates, updateAllRates } = useEpcisRates()
  const [valueInput, setValueInput] = useState<string | undefined>(undefined)

  // Calculate average secondary accommodation rate across all EPCIs
  const epciIds = Object.keys(defaultRates)
  const averageTxRS = epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + defaultRates[epciId].txRS, 0) / epciIds.length : 0

  useEffect(() => {
    if (averageTxRS) {
      setValueInput(`${(averageTxRS * 100).toFixed(2)}`)
      // Apply initial value to all EPCIs
      applyRateToAllEpcis(averageTxRS)
    }
  }, [])

  const applyRateToAllEpcis = (rate: number) => {
    const newRatesPerEpci: Record<string, Partial<RateSettings>> = {}
    epciIds.forEach((epciId) => {
      newRatesPerEpci[epciId] = { txRS: rate }
    })
    updateAllRates(newRatesPerEpci)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value.replace(',', '.'))
    setValueInput(e.target.value)

    if (value > 100) {
      value = 100
      setValueInput('100')
    } else if (value < 0) {
      value = 0
      setValueInput('0')
    }

    applyRateToAllEpcis(value / 100)
  }

  return (
    <div className="fr-flex fr-align-items-end fr-flex-gap-2v">
      <Input
        iconId="ri-percent-line"
        label={`Quel objectif de taux souhaitez-vous fixer pour l'horizon ${projection} ?`}
        nativeInputProps={{
          onChange: handleInputChange,
          type: 'text',
          value: valueInput,
        }}
      />
    </div>
  )
}
