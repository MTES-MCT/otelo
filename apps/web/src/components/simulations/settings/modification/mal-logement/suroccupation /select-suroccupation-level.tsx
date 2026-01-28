'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectSuroccupationLevel = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Select
      label="Niveau de suroccupation"
      nativeSelectProps={{
        name: 'suroccupationLevel',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, suroccupation: { ...badHousingSettings.suroccupation, surocc: e.target.value } }),
        value: badHousingSettings.suroccupation.surocc,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      {/* todo */}
      <option value="AccMod">Suroccupation modérée et accentuée</option>
      <option value="Acc">Suroccupation accentuée</option>
    </Select>
  )
}
