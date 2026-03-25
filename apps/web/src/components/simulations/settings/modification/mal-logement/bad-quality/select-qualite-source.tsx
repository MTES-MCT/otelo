'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectQualiteSource = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()

  if (badHousingSettings.badQuality.source !== 'FF') {
    return null
  }

  return (
    <Select
      label="Qualité"
      nativeSelectProps={{
        name: 'qualite',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, badQuality: { ...badHousingSettings.badQuality, qualite: e.target.value } }),
        value: badHousingSettings.badQuality.qualite,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      <option value="FF_Ind">Individuel</option>
      <option value="FF_ss_ent">Sans entretien</option>
      <option value="FF_ss_ent_mvq">Sans qualité entretien</option>
    </Select>
  )
}
