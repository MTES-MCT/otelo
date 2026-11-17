'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { FC, useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { DISAPPEARANCE_DEFINITION, RESTRUCTURATION_DEFINITION } from '~/components/simulations/tutorial/definitions'
import { DefinitionTooltip } from '~/components/ui/definition-tooltip'
import { ReadingKey } from '~/components/ui/reading-key'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

type ModifyRestructurationDisparitionRatesInputProps = {
  epci: string
}

export const ModifyRestructurationDisparitionRatesInput: FC<ModifyRestructurationDisparitionRatesInputProps> = ({ epci }) => {
  const { simulationSettings, updateRates } = useSimulationSettings()
  const { data: rates } = useAccommodationRatesByEpci([epci], simulationSettings.millesime)
  const accommodationRate = rates?.[epci]
  const urbanRenewalAccommodations = accommodationRate?.urbanRenewal ?? 0
  const ratesByEpci = simulationSettings.epciScenarios[epci]
  const restructuringRate = ratesByEpci.restructuringRate
  const disappearanceRate = ratesByEpci.disappearanceRate

  const [restructuringRateInput, setRestructuringRateInput] = useState(`${Number(restructuringRate * 100).toFixed(2)}`)
  const [disappearanceRateInput, setDisappearanceRateInput] = useState(`${Number(disappearanceRate * 100).toFixed(2)}`)

  const handleRestructuringRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value.replace(',', '.'))
    setRestructuringRateInput(e.target.value)
    if (value > 100) {
      setRestructuringRateInput('100')
    } else if (value < 0) {
      setRestructuringRateInput('0')
    } else {
      setRestructuringRateInput(e.target.value)
    }
    updateRates(epci, { restructuringRate: value / 100 })
  }

  const handleDisappearanceRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value.replace(',', '.'))
    setDisappearanceRateInput(e.target.value)
    if (value > 100) {
      setDisappearanceRateInput('100')
    } else if (value < 0) {
      setDisappearanceRateInput('0')
    } else {
      setDisappearanceRateInput(e.target.value)
    }
    updateRates(epci, { disappearanceRate: value / 100 })
  }

  const urbanRenewalAccommodationsTotal = Math.round(Math.abs(disappearanceRate - restructuringRate) * urbanRenewalAccommodations)
  return (
    <div className="fr-flex fr-direction-column">
      <div className="fr-flex fr-flex-gap-4v">
        <div className="fr-flex fr-direction-column fr-width-full">
          <Input
            className="fr-width-full"
            iconId="ri-percent-line"
            label={
              <>
                <span className="fr-text--medium">Taux annuel de restructuration</span>{' '}
                <DefinitionTooltip definition={RESTRUCTURATION_DEFINITION} />
              </>
            }
            nativeInputProps={{
              type: 'text',
              value: restructuringRateInput,
              onChange: handleRestructuringRateChange,
            }}
          />
        </div>

        <div className="fr-flex fr-direction-column fr-width-full">
          <Input
            className="fr-width-full"
            iconId="ri-percent-line"
            label={
              <>
                <span className="fr-text--medium">Taux annuel de disparition</span>{' '}
                <DefinitionTooltip definition={DISAPPEARANCE_DEFINITION} />
              </>
            }
            nativeInputProps={{
              type: 'text',
              value: disappearanceRateInput,
              onChange: handleDisappearanceRateChange,
            }}
          />
        </div>
      </div>
      <ReadingKey className="fr-mt-2w">
        <>
          <span>
            Le rythme de renouvellement urbain impliquerait une{' '}
            <strong>{restructuringRate > disappearanceRate ? 'diminution' : 'hausse'}</strong> du besoin en logements supplémentaires à
            hauteur de <strong>{urbanRenewalAccommodationsTotal}</strong> logements par an.
          </span>
        </>
      </ReadingKey>
    </div>
  )
}
