'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'

export const RestructurationRatesToggleSwitch: FC = () => {
  const [restructurationRates, setRates] = useQueryState('restructurationRates', parseAsString)

  const handleChange = (checked: boolean) => {
    setRates(checked ? 'all' : null)
  }

  return (
    <ToggleSwitch
      label={<span className="fr-text--medium">Appliquer les taux à l'ensemble du territoire</span>}
      inputTitle="restructurationRates"
      labelPosition="left"
      checked={restructurationRates === 'all'}
      onChange={handleChange}
      showCheckedHint={false}
    />
  )
}
