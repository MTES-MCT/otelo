'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'

export const SecondaryRatesToggleSwitch: FC = () => {
  const [secondaryRates, setSecondaryRates] = useQueryState('secondaryRates', parseAsString)

  const handleChange = (checked: boolean) => {
    setSecondaryRates(checked ? 'all' : null)
  }

  return (
    <ToggleSwitch
      label={<span className="fr-text--medium">Appliquer le taux à l'ensemble du territoire</span>}
      inputTitle="secondaryRates"
      labelPosition="left"
      checked={secondaryRates === 'all'}
      onChange={handleChange}
      showCheckedHint={false}
    />
  )
}
