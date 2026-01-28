'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { ComponentProps } from 'react'
import { TEpci } from '@shared'

type MultipleEpciSelectProps = {
  epcis: TEpci[]
  selectedEpcis: TEpci[]
  onChange: (selectedEpcis: TEpci[]) => void
  error?: string
}

export function MultipleEpciSelect({ epcis, selectedEpcis, onChange, error }: MultipleEpciSelectProps) {
  const createOptions = (epcis: TEpci[]): ComponentProps<typeof Checkbox>['options'] =>
    epcis.map((epci) => ({
      label: epci.name,
      nativeInputProps: {
        checked: selectedEpcis.some((selected) => selected.code === epci.code),
        name: epci.name,
        onChange: (e) => {
          const isChecked = e.target.checked
          const newSelectedEpcis = isChecked ? [...selectedEpcis, epci] : selectedEpcis.filter((selected) => selected.code !== epci.code)
          onChange(newSelectedEpcis)
        },
        value: epci.code,
      },
    }))

  return (
    <div className={fr.cx('fr-mb-6w')}>
      <fieldset className={fr.cx('fr-fieldset')}>
        <legend className={fr.cx('fr-fieldset__legend', 'fr-text--regular')}>
          <strong>Vos territoires (EPCIs pour lesquels vous souhaitez obtenir vos résultats)</strong>
        </legend>
        <div className={fr.cx('fr-fieldset__content')}>
          <Checkbox options={createOptions(epcis)} state={error ? 'error' : undefined} stateRelatedMessage={error} />
        </div>
      </fieldset>
    </div>
  )
}
