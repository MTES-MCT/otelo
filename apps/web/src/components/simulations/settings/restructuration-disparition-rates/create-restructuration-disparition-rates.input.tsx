'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import Button from '@codegouvfr/react-dsfr/Button'
import CallOut from '@codegouvfr/react-dsfr/CallOut'
import Input from '@codegouvfr/react-dsfr/Input'
import classNames from 'classnames'
import { FC, useState } from 'react'
import { tss } from 'tss-react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

type CreateRestructurationDisparitionRatesInputProps = {
  epci: string
}

export const CreateRestructurationDisparitionRatesInput: FC<CreateRestructurationDisparitionRatesInputProps> = ({ epci }) => {
  const { classes } = useStyles()
  const { rates, updateRates } = useEpcisRates()
  const { data: accommodationRates } = useAccommodationRatesByEpci([epci])
  const accommodationRate = accommodationRates?.[epci]
  const urbanRenewalAccommodations = accommodationRate?.urbanRenewal ?? 0
  const ratesByEpci = rates[epci]

  // Initialize state with safe fallbacks
  const restructuringRate = ratesByEpci?.restructuringRate ?? 0
  const disappearanceRate = ratesByEpci?.disappearanceRate ?? 0

  const [restructuringRateInput, setRestructuringRateInput] = useState(`${Number(restructuringRate * 100).toFixed(2)}`)
  const [disappearanceRateInput, setDisappearanceRateInput] = useState(`${Number(disappearanceRate * 100).toFixed(2)}`)
  const [restructuringExpanded, setRestructuringExpanded] = useState(false)
  const [disappearanceExpanded, setDisappearanceExpanded] = useState(false)

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
            label={<span className="fr-text--medium">Taux annuel de restructuration</span>}
            nativeInputProps={{
              type: 'text',
              value: restructuringRateInput,
              onChange: handleRestructuringRateChange,
            }}
          />
          <Button
            priority="tertiary no outline"
            iconPosition="right"
            iconId={restructuringExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
            onClick={() => setRestructuringExpanded(!restructuringExpanded)}
            className="fr-mt-1v"
            size="small"
          >
            À quoi correspond ce taux ?
          </Button>
          {restructuringExpanded && (
            <p className="fr-text--sm fr-text-mention--grey fr-mt-1v">
              Les restructurations correspondent aux créations de nouveaux logements au sein du parc existant, à travers la division de
              logement ou de changement d'usages (par exemple la transformation de locaux d'activités en logements). Le taux de
              restructuration correspond au volume de logements créés par ces phénomènes de restructuration, rapporté à l'ensemble du parc.
            </p>
          )}
        </div>

        <div className="fr-flex fr-direction-column fr-width-full">
          <Input
            className="fr-width-full"
            iconId="ri-percent-line"
            label={<span className="fr-text--medium">Taux annuel de disparition</span>}
            nativeInputProps={{
              type: 'text',
              value: disappearanceRateInput,
              onChange: handleDisappearanceRateChange,
            }}
          />
          <Button
            priority="tertiary no outline"
            iconPosition="right"
            iconId={disappearanceExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
            onClick={() => setDisappearanceExpanded(!disappearanceExpanded)}
            className="fr-mt-1v"
            size="small"
          >
            À quoi correspond ce taux ?
          </Button>
          {disappearanceExpanded && (
            <p className="fr-text--sm fr-text-mention--grey fr-mt-1v">
              Le taux annuel de disparition correspond à la proportion du parc de logement qui a disparu durant une année. Cela peut
              correspondre à des logements démolis ou à des logements disparus du fait de fusions ou de changements d'usage (par exemple la
              transformation d'un logement en local d'activité).
            </p>
          )}
        </div>
      </div>
      <CallOut
        className="fr-mt-2w"
        title={
          <Badge severity="new" noIcon small>
            <span className={classNames(classes.badgeIcon, 'ri-lightbulb-line fr-mr-1v')} />
            <span className="fr-text--uppercase">Clé de lecture</span>
          </Badge>
        }
      >
        <>
          <span>
            Le rythme de renouvellement urbain impliquerait une{' '}
            <strong>{restructuringRate > disappearanceRate ? 'diminution' : 'hausse'}</strong> du besoin en logements supplémentaires à
            hauteur de <strong>{urbanRenewalAccommodationsTotal}</strong> logements par an.
          </span>
        </>
      </CallOut>
    </div>
  )
}

const useStyles = tss.create({
  badgeIcon: {
    '&::before': {
      '--icon-size': '12px',
    },
  },
})
