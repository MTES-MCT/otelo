'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { useQueryState } from 'nuqs'
import { FC, useEffect, useState } from 'react'
import { RateSettings, useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'

interface CreateAllSecondaryAccommodationRateInputProps {
  epcis: Array<{ code: string; name: string }>
}

export const CreateAllSecondaryAccommodationRateInput: FC<CreateAllSecondaryAccommodationRateInputProps> = ({ epcis }) => {
  const [projection] = useQueryState('projection')
  const { defaultRates, updateAllRates } = useEpcisRates()
  const [valueInput, setValueInput] = useState<string | undefined>(undefined)
  const [targetRate, setTargetRate] = useState<number | undefined>(undefined)

  // Calculate weighted average secondary accommodation rate across all EPCIs
  const epciIds = Object.keys(defaultRates)
  const totalParc = epciIds.reduce((sum, epciId) => sum + (defaultRates[epciId].parctot || 0), 0)
  const averageTxRS =
    totalParc > 0
      ? epciIds.reduce((sum, epciId) => sum + defaultRates[epciId].txRS * (defaultRates[epciId].parctot || 0), 0) / totalParc
      : 0

  useEffect(() => {
    if (averageTxRS) {
      setValueInput(`${(averageTxRS * 100).toFixed(2)}`)
    }
  }, [])

  const applyRateToAllEpcis = (targetRate: number) => {
    if (averageTxRS === 0) return
    const variationCoeff = targetRate / averageTxRS
    const newRatesPerEpci: Record<string, Partial<RateSettings>> = {}
    epciIds.forEach((epciId) => {
      newRatesPerEpci[epciId] = { txRS: defaultRates[epciId].txRS * variationCoeff }
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
          label={`Quel objectif de taux souhaitez-vous fixer pour l'horizon ${projection} ?`}
          nativeInputProps={{
            onChange: handleInputChange,
            type: 'text',
            value: valueInput,
          }}
        />
      </div>
      <div className="fr-mt-2w">
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
            const originalRate = defaultRates[epciId].txRS * 100
            const adjustedRate = defaultRates[epciId].txRS * ((targetRate ?? averageTxRS) / averageTxRS) * 100
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
