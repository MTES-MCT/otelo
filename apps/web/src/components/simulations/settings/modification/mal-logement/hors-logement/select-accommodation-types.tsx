'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectAccommodationTypes = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  const {
    horsLogement: { accommodationTypes },
  } = badHousingSettings

  const handleToggleAccommodationType = (type: string) => {
    const updatedTypes = accommodationTypes.includes(type) ? accommodationTypes.filter((t) => t !== type) : [...accommodationTypes, type]

    setBadHousingSettings({
      ...badHousingSettings,
      horsLogement: {
        ...badHousingSettings.horsLogement,
        accommodationTypes: updatedTypes,
      },
    })
  }

  return (
    <Checkbox
      legend="Type d'hébergement"
      options={[
        {
          label: "Autre centre d'accueil",
          nativeInputProps: {
            checked: accommodationTypes.includes('autreCentre'),
            name: 'autreCentre',
            onChange: () => handleToggleAccommodationType('autreCentre'),
            value: 'autreCentre',
          },
        },
        {
          label: "Centre d'accueil demandeur d'asile",
          nativeInputProps: {
            checked: accommodationTypes.includes('demandeAsile'),
            name: 'demandeAsile',
            onChange: () => handleToggleAccommodationType('demandeAsile'),
            value: 'demandeAsile',
          },
        },
        {
          label: "Centre d'hébergement réinsertion sociale",
          nativeInputProps: {
            checked: accommodationTypes.includes('reinsertion'),
            name: 'reinsertion',
            onChange: () => handleToggleAccommodationType('reinsertion'),
            value: 'reinsertion',
          },
        },
        {
          label: 'Centre provisoire hébergement',
          nativeInputProps: {
            checked: accommodationTypes.includes('centreProvisoire'),
            name: 'centreProvisoire',
            onChange: () => handleToggleAccommodationType('centreProvisoire'),
            value: 'centreProvisoire',
          },
        },
        {
          label: 'Foyer jeunes travailleurs',
          nativeInputProps: {
            checked: accommodationTypes.includes('jeuneTravailleur'),
            name: 'jeuneTravailleur',
            onChange: () => handleToggleAccommodationType('jeuneTravailleur'),
            value: 'jeuneTravailleur',
          },
        },
        {
          label: 'Foyer travailleurs migrants',
          nativeInputProps: {
            checked: accommodationTypes.includes('foyerMigrants'),
            name: 'foyerMigrants',
            onChange: () => handleToggleAccommodationType('foyerMigrants'),
            value: 'foyerMigrants',
          },
        },
        {
          label: 'Hébergement familles malades',
          nativeInputProps: {
            checked: accommodationTypes.includes('malade'),
            name: 'malade',
            onChange: () => handleToggleAccommodationType('malade'),
            value: 'malade',
          },
        },
        {
          label: 'Maisons relais - pensions',
          nativeInputProps: {
            checked: accommodationTypes.includes('maisonRelai'),
            name: 'maisonRelai',
            onChange: () => handleToggleAccommodationType('maisonRelai'),
            value: 'maisonRelai',
          },
        },
        {
          label: 'Résidences sociale hors Maisons Relais',
          nativeInputProps: {
            checked: accommodationTypes.includes('horsMaisonRelai'),
            name: 'horsMaisonRelai',
            onChange: () => handleToggleAccommodationType('horsMaisonRelai'),
            value: 'horsMaisonRelai',
          },
        },
      ]}
      orientation="horizontal"
    />
  )
}
