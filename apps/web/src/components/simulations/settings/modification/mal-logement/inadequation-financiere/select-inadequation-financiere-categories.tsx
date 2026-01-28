'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectInadequationFinanciereCategories = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  const handleToggle = (type: string) => {
    setBadHousingSettings({
      ...badHousingSettings,
      inadequationFinanciere: {
        ...badHousingSettings.inadequationFinanciere,
        [type]: !badHousingSettings.inadequationFinanciere[type as keyof typeof badHousingSettings.inadequationFinanciere],
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
            checked: badHousingSettings.inadequationFinanciere.accedant,
            name: 'accedant',
            onChange: () => handleToggle('accedant'),
            value: 'accedant',
          },
        },
        {
          label: 'Locataires du parc privé',
          nativeInputProps: {
            checked: badHousingSettings.inadequationFinanciere.plp,
            name: 'plp',
            onChange: () => handleToggle('plp'),
            value: 'plp',
          },
        },
      ]}
    />
  )
}
