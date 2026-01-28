'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'

export const RatesToggleSwitch: FC = () => {
  const [vacantRates, setRates] = useQueryState('vacantRates', parseAsString)

  const handleChange = (checked: boolean) => {
    setRates(checked ? 'all' : null)
  }

  return (
    <ToggleSwitch
      label={<span className="fr-text--medium">Appliquer le taux à l'ensemble du territoire</span>}
      inputTitle="vacantRates"
      labelPosition="left"
      checked={vacantRates === 'all'}
      onChange={handleChange}
      showCheckedHint={false}
    />
  )
}
