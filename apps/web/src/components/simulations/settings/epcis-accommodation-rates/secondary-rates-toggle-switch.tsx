'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import styles from './epcis-accommodation-rates.module.css'

interface Props {
  disabled?: boolean
  disabledMessage?: string
}

const DISABLED_TOGGLE_MESSAGE =
  "Les horizons de projection sont différents selon les territoires du bassin d'habitat. Dès lors, il n'est pas possible d'appliquer un taux uniforme à l'ensemble du territoire."

export const SecondaryRatesToggleSwitch: FC<Props> = ({ disabled, disabledMessage = DISABLED_TOGGLE_MESSAGE }) => {
  const [secondaryRates, setSecondaryRates] = useQueryState('secondaryRates', parseAsString)

  const handleChange = (checked: boolean) => {
    setSecondaryRates(checked ? 'all' : null)
  }

  return (
    <div>
      <ToggleSwitch
        className={styles.compactToggle}
        label={<span className="fr-text--medium">Appliquer le taux à l'ensemble du territoire</span>}
        inputTitle="secondaryRates"
        labelPosition="left"
        checked={disabled ? false : secondaryRates === 'all'}
        onChange={handleChange}
        showCheckedHint={false}
        disabled={disabled}
      />
      {disabled && disabledMessage && <p className="fr-text--sm fr-text-mention--grey fr-mt-1v fr-mb-0">{disabledMessage}</p>}
    </div>
  )
}
