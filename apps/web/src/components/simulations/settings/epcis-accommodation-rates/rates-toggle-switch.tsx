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

export const RatesToggleSwitch: FC<Props> = ({ disabled, disabledMessage = DISABLED_TOGGLE_MESSAGE }) => {
  const [vacantRates, setRates] = useQueryState('vacantRates', parseAsString)

  const handleChange = (checked: boolean) => {
    setRates(checked ? 'all' : null)
  }

  return (
    <div className="fr-mt-2w">
      <ToggleSwitch
        className={styles.compactToggle}
        label={<span className="fr-text--medium">Appliquer le taux à l'ensemble du territoire</span>}
        inputTitle="vacantRates"
        labelPosition="left"
        checked={disabled ? false : vacantRates === 'all'}
        onChange={handleChange}
        showCheckedHint={false}
        disabled={disabled}
      />
      {disabled && disabledMessage && <p className="fr-text--sm fr-text-mention--grey fr-mt-1v fr-mb-0">{disabledMessage}</p>}
    </div>
  )
}
