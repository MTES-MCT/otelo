'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectSuroccupationSource = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Select
      label="Statut d'occupation"
      nativeSelectProps={{
        name: 'statut',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, suroccupation: { ...badHousingSettings.suroccupation, source: e.target.value } }),
        value: badHousingSettings.suroccupation.source,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      <option value="RP">Recensement INSEE</option>
      <option value="Filo">CGDD/SDES à partir de données fiscales</option>
    </Select>
  )
}
