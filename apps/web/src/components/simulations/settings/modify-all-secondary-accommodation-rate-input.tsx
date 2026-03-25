'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { TAccommodationRates } from '@shared'
import { FC, useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

interface ModifyAllSecondaryAccommodationRateInputProps {
  epcis: Array<{ code: string; name: string }>
}

export const ModifyAllSecondaryAccommodationRateInput: FC<ModifyAllSecondaryAccommodationRateInputProps> = ({ epcis }) => {
  const { simulationSettings, updateAllRates } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds)

  // Calculate weighted average secondary accommodation rate across all EPCIs
  const totalParc = originalRatesData ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.urbanRenewal || 0), 0) : 0
  const averageTxRS =
    originalRatesData && totalParc > 0
      ? epciIds.reduce((sum, epciId) => sum + (originalRatesData[epciId]?.txRs || 0) * (originalRatesData[epciId]?.urbanRenewal || 0), 0) /
        totalParc
      : 0

  const [valueInput, setValueInput] = useState(`${(averageTxRS * 100).toFixed(2)}`)
  const [targetRate, setTargetRate] = useState<number | undefined>(undefined)

  const applyRateToAllEpcis = (targetRate: number) => {
    if (!originalRatesData || averageTxRS === 0) return
    const variationCoeff = targetRate / averageTxRS
    const newRatesPerEpci: Record<string, Partial<TAccommodationRates>> = {}
    epciIds.forEach((epciId) => {
      newRatesPerEpci[epciId] = { txRs: (originalRatesData[epciId]?.txRs || 0) * variationCoeff }
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

    setTargetRate(value / 100)
    applyRateToAllEpcis(value / 100)
  }

  const epciNameMap = Object.fromEntries(epcis.map((e) => [e.code, e.name]))
  const variationPercent = targetRate !== undefined && averageTxRS > 0 ? ((targetRate - averageTxRS) / averageTxRS) * 100 : 0
  const isNoVariation = Math.abs(variationPercent) < 0.01

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v">
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
      <div className="fr-mt-2w">
        {targetRate !== undefined && (
          <p className="fr-text--sm fr-mb-1w fr-text--bold">
            Le taux projeté à l'année {simulationSettings.projection} est de : {(averageTxRS * 100).toFixed(2)} % -{' '}
            {((averageTxRS - targetRate) * 100).toFixed(2)} % = {(targetRate * 100).toFixed(2)} %
          </p>
        )}
        <p className="fr-text--sm fr-mb-1w">
          Ce taux cible de résidences secondaires correspond à{' '}
          {isNoVariation ? (
            <strong>un maintien</strong>
          ) : (
            <strong>
              une {variationPercent < 0 ? 'diminution' : 'augmentation'} de {Math.abs(variationPercent).toFixed(1)} %
            </strong>
          )}{' '}
          de la part des résidences secondaires dans le parc total.
        </p>
        <ul className="fr-text--sm fr-pl-2w" style={{ listStyleType: 'disc' }}>
          {epciIds.map((epciId) => {
            const originalRate = (originalRatesData?.[epciId]?.txRs || 0) * 100
            const adjustedRate = (originalRatesData?.[epciId]?.txRs || 0) * ((targetRate ?? averageTxRS) / averageTxRS) * 100
            return (
              <li key={epciId}>
                {epciNameMap[epciId] || epciId} : {originalRate.toFixed(2)} % → {adjustedRate.toFixed(2)} %
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
