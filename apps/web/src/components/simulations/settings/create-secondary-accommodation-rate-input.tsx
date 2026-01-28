'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { FC, useEffect, useState } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'

type CreateAccommodationRateInputProps = {
  disabled?: boolean
  epci: string
  label: string
}

export const CreateSecondaryAccommodationRateInput: FC<CreateAccommodationRateInputProps> = ({ disabled = false, epci, label }) => {
  const { rates, defaultRates, updateRates } = useEpcisRates()
  const ratesByEpci = rates[epci]
  const defaultRatesByEpci = defaultRates[epci]
  const [valueInput, setValueInput] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!!defaultRatesByEpci && defaultRatesByEpci.txRS) {
      setValueInput(`${Number(defaultRatesByEpci.txRS * 100).toFixed(2)}`)
    }
  }, [defaultRatesByEpci])

  if (!ratesByEpci) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value.replace(',', '.'))
    setValueInput(e.target.value)
    if (value > 100) {
      setValueInput('100')
    } else if (value < 0) {
      setValueInput('0')
    } else {
      setValueInput(e.target.value)
    }
    updateRates(epci, { ['txRS']: value / 100 })
  }

  return (
    <div className="fr-flex fr-align-items-end fr-flex-gap-2v">
      <Input
        disabled={disabled}
        iconId="ri-percent-line"
        label={label}
        nativeInputProps={{
          onChange: handleInputChange,
          type: 'text',
          value: valueInput,
        }}
      />
    </div>
  )
}
