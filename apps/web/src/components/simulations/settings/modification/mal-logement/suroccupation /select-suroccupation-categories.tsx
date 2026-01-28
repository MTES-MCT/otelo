'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectSuroccupationCategories = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  const handleToggle = (type: string) => {
    setBadHousingSettings({
      ...badHousingSettings,
      suroccupation: {
        ...badHousingSettings.suroccupation,
        [type]: !badHousingSettings.suroccupation[type as keyof typeof badHousingSettings.suroccupation],
      },
    })
  }
  return (
    <Checkbox
      orientation="horizontal"
      options={[
        {
          label: 'Propriétaire',
          nativeInputProps: {
            checked: badHousingSettings.suroccupation.proprietaire,
            name: 'proprietaire',
            onChange: () => handleToggle('proprietaire'),
            value: 'proprietaire',
          },
        },
        {
          label: 'Locataires du parc privé',
          nativeInputProps: {
            checked: badHousingSettings.suroccupation.plp,
            name: 'locataires-du-parc-prive',
            onChange: () => handleToggle('plp'),
            value: 'plp',
          },
        },
      ]}
    />
  )
}
