'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectNoAccommodationSource = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Select
      label="Source de données"
      nativeSelectProps={{
        name: 'source',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, horsLogement: { ...badHousingSettings.horsLogement, source: e.target.value } }),
        value: badHousingSettings.horsLogement.source,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      <option value="RP">Recensement INSEE</option>
      <option value="SNE">Système National d&apos;Enregistrement</option>
    </Select>
  )
}
