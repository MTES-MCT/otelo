'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectOccupationSource = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Select
      label="Statut d'occupation"
      nativeSelectProps={{
        name: 'statut',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, badQuality: { ...badHousingSettings.badQuality, occupation: e.target.value } }),
        value: badHousingSettings.badQuality.occupation,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      <option value="prop">Propriétaires seuls</option>
      <option value="loc">Locataires seuls</option>
      <option value="prop_loc">Propriétaires et locataires</option>
    </Select>
  )
}
