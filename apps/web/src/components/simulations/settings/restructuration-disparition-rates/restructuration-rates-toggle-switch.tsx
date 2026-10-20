'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import styles from '~/components/simulations/settings/epcis-accommodation-rates/epcis-accommodation-rates.module.css'

export const RestructurationRatesToggleSwitch: FC = () => {
  const [restructurationRates, setRates] = useQueryState('restructurationRates', parseAsString)

  const handleChange = (checked: boolean) => {
    setRates(checked ? 'all' : null)
  }

  return (
    <div className="fr-mt-2w">
      <ToggleSwitch
        className={styles.compactToggle}
        label={<span className="fr-text--medium">Appliquer les taux à l'ensemble du territoire</span>}
        inputTitle="restructurationRates"
        labelPosition="left"
        checked={restructurationRates === 'all'}
        onChange={handleChange}
        showCheckedHint={false}
      />
    </div>
  )
}
