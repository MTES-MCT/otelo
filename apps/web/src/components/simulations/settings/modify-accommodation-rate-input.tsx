'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { FC, useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'

type ModifyAccommodationRateInputProps = {
  disabled?: boolean
  epci: string
  label: string
  txKey: string
}

export const ModifySecondaryAccommodationRateInput: FC<ModifyAccommodationRateInputProps> = ({ disabled = false, epci, label, txKey }) => {
  const { simulationSettings, updateRates } = useSimulationSettings()
  const ratesByEpci = simulationSettings.epciScenarios[epci]
  const value = ratesByEpci[txKey as keyof typeof ratesByEpci]
  const [valueInput, setValueInput] = useState(`${Number((value as number) * 100).toFixed(2)}`)

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
    updateRates(epci, { [txKey]: value / 100 })
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
