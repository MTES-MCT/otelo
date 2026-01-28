'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectConfortSource = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()

  if (badHousingSettings.badQuality.source === 'Filo') {
    return null
  }
  const rpOptions = [
    {
      label: 'Absence sanitaire',
      value: 'abs_sani',
    },
    {
      label: 'Absence sanitaire et chauffage',
      value: 'abs_sani_chauff',
    },
  ]

  const ffOptions = [
    {
      label: 'Absence WC',
      value: 'abs_wc',
    },
    {
      label: 'Absence Chauffage central',
      value: 'abs_chauf',
    },
    {
      label: 'Absence Salle de bain',
      value: 'abs_sani',
    },
    {
      label: 'Absence WC et Chauffage central',
      value: 'abs_wc_chauf',
    },
    {
      label: 'Absence WC et Salle de bain',
      value: 'abs_wc_sani',
    },
    {
      label: 'Absence Salle de bain et Chauffage central',
      value: 'abs_sani_chauf',
    },
    {
      label: 'Absence WC, Salle de bain et Chauffage central',
      value: 'abs_wc_sani_chauf',
    },
  ]

  const options = badHousingSettings.badQuality.source === 'RP' ? rpOptions : ffOptions

  return (
    <Select
      label="Confort"
      nativeSelectProps={{
        name: 'confort',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, badQuality: { ...badHousingSettings.badQuality, confort: e.target.value } }),
        value: badHousingSettings.badQuality.confort,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
