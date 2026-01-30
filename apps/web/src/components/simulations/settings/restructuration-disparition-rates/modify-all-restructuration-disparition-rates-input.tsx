'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { TAccommodationRates } from '@shared'
import { FC, useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

export const ModifyAllRestructurationDisparitionRatesInput: FC = () => {
  const { simulationSettings, updateAllRates } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds)

  // Calculate average rates across all EPCIs
  const averageRestructuringRate =
    originalRatesData && epciIds.length > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.restructuringRate || 0), 0) / epciIds.length
      : 0

  const averageDisappearanceRate =
    originalRatesData && epciIds.length > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.disappearanceRate || 0), 0) / epciIds.length
      : 0

  const totalUrbanRenewal =
    originalRatesData && epciIds.length > 0 ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.urbanRenewal || 0), 0) : 0

  const [restructuringRateInput, setRestructuringRateInput] = useState(`${(averageRestructuringRate * 100).toFixed(2)}`)
  const [disappearanceRateInput, setDisappearanceRateInput] = useState(`${(averageDisappearanceRate * 100).toFixed(2)}`)

  const applyRatesToAllEpcis = (rateKey: 'restructuringRate' | 'disappearanceRate', rate: number) => {
    const newRatesPerEpci: Record<string, Partial<TAccommodationRates>> = {}
    epciIds.forEach((epciId) => {
      newRatesPerEpci[epciId] = { [rateKey]: rate }
    })
    updateAllRates(newRatesPerEpci)
  }

  const handleRestructuringRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value.replace(',', '.'))
    setRestructuringRateInput(e.target.value)

    if (value > 100) {
      value = 100
      setRestructuringRateInput('100')
    } else if (value < 0) {
      value = 0
      setRestructuringRateInput('0')
    }

    applyRatesToAllEpcis('restructuringRate', value / 100)
  }

  const handleDisappearanceRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value.replace(',', '.'))
    setDisappearanceRateInput(e.target.value)

    if (value > 100) {
      value = 100
      setDisappearanceRateInput('100')
    } else if (value < 0) {
      value = 0
      setDisappearanceRateInput('0')
    }

    applyRatesToAllEpcis('disappearanceRate', value / 100)
  }

  // Get current rates from state
  const currentRestructuringRate = Number(restructuringRateInput.replace(',', '.')) / 100
  const currentDisappearanceRate = Number(disappearanceRateInput.replace(',', '.')) / 100
  const urbanRenewalAccommodationsTotal = Math.round(Math.abs(currentDisappearanceRate - currentRestructuringRate) * totalUrbanRenewal)

  return (
    <div className="fr-flex fr-direction-column">
      <div className="fr-flex fr-flex-gap-4v">
        <Input
          className="fr-width-full"
          iconId="ri-percent-line"
          label="Taux annuel de restructuration"
          nativeInputProps={{
            type: 'text',
            value: restructuringRateInput,
            onChange: handleRestructuringRateChange,
          }}
        />
        <Input
          className="fr-width-full"
          iconId="ri-percent-line"
          label="Taux annuel de disparition"
          nativeInputProps={{
            type: 'text',
            value: disappearanceRateInput,
            onChange: handleDisappearanceRateChange,
          }}
        />
      </div>
      <p>
        Le rythme de renouvellement urbain impliquerait une{' '}
        <strong>{currentRestructuringRate > currentDisappearanceRate ? 'diminution' : 'hausse'}</strong> du besoin en logements
        supplémentaires à hauteur de <strong>{urbanRenewalAccommodationsTotal}</strong> logements par an.
      </p>
    </div>
  )
}
