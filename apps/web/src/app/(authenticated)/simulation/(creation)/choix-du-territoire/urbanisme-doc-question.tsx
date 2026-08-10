'use client'

import { fr } from '@codegouvfr/react-dsfr'
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'

export const UrbanismeDocQuestion: FC = () => {
  const [{ urbanismeDoc }, setQueryStates] = useQueryStates({
    urbanismeDoc: parseAsString,
  })

  const setUrbanismeDoc = (value: 'oui' | 'non') => setQueryStates({ urbanismeDoc: value })

  return (
    <RadioButtons
      // Remontage forcé : DSFR mémorise l'état coché de ses inputs, qui désynchronise sinon de l'URL.
      key={`urbanisme-doc-${urbanismeDoc ?? 'none'}`}
      className={fr.cx('fr-mb-0')}
      legend="Travaillez-vous sur un document d'urbanisme ?"
      hintText="Le nom du groupe vous sera proposé à partir du document trouvé sur Docurba pour ce territoire."
      orientation="horizontal"
      name="urbanisme-doc"
      options={[
        {
          label: 'Oui',
          nativeInputProps: { value: 'oui', checked: urbanismeDoc === 'oui', onChange: () => setUrbanismeDoc('oui') },
        },
        {
          label: 'Non',
          nativeInputProps: { value: 'non', checked: urbanismeDoc === 'non', onChange: () => setUrbanismeDoc('non') },
        },
      ]}
    />
  )
}
