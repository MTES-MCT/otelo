'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { TAccommodationRates } from '@shared'
import { FC, useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

export const ModifyAllSecondaryAccommodationRateInput: FC = () => {
  const { simulationSettings, updateAllRates } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds)

  // Calculate average secondary accommodation rate across all EPCIs
  const averageTxRS =
    originalRatesData && epciIds.length > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.txRs || 0), 0) / epciIds.length
      : 0

  const [valueInput, setValueInput] = useState(`${(averageTxRS * 100).toFixed(2)}`)

  const applyRateToAllEpcis = (rate: number) => {
    const newRatesPerEpci: Record<string, Partial<TAccommodationRates>> = {}
    epciIds.forEach((epciId) => {
      newRatesPerEpci[epciId] = { txRs: rate }
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
        label={`Quel objectif de taux souhaitez-vous fixer pour l'horizon ${simulationSettings.projection} ?`}
        nativeInputProps={{
          onChange: handleInputChange,
          type: 'text',
          value: valueInput,
        }}
      />
    </div>
  )
}
