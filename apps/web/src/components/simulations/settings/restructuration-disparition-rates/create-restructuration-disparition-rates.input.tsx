'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { parseAsString, useQueryState } from 'nuqs'
import { FC, useState } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { DISAPPEARANCE_DEFINITION, RESTRUCTURATION_DEFINITION } from '~/components/simulations/tutorial/definitions'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { DefinitionTooltip } from '~/components/ui/definition-tooltip'
import { ReadingKey } from '~/components/ui/reading-key'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

type CreateRestructurationDisparitionRatesInputProps = {
  epci: string
}

export const CreateRestructurationDisparitionRatesInput: FC<CreateRestructurationDisparitionRatesInputProps> = ({ epci }) => {
  const [millesime] = useQueryState('millesime', parseAsString)
  const { rates, updateRates } = useEpcisRates()
  const { data: accommodationRates } = useAccommodationRatesByEpci([epci], millesime ?? undefined)
  const accommodationRate = accommodationRates?.[epci]
  const urbanRenewalAccommodations = accommodationRate?.urbanRenewal ?? 0
  const ratesByEpci = rates[epci]

  // Initialize state with safe fallbacks
  const restructuringRate = ratesByEpci?.restructuringRate ?? 0
  const disappearanceRate = ratesByEpci?.disappearanceRate ?? 0

  const [restructuringRateInput, setRestructuringRateInput] = useState(`${Number(restructuringRate * 100).toFixed(2)}`)
  const [disappearanceRateInput, setDisappearanceRateInput] = useState(`${Number(disappearanceRate * 100).toFixed(2)}`)

  if (!ratesByEpci) return null

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
      {/* La clé de lecture (un CallOut du DSFR) n'accepte pas d'attribut arbitraire : l'ancre passe par un wrapper. */}
      <div {...tutorialAnchor('renewal-reading-key')}>
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
    </div>
  )
}
