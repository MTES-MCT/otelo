'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectBadQualitySource = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Select
      label="Source de données"
      nativeSelectProps={{
        name: 'source',
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, badQuality: { ...badHousingSettings.badQuality, source: e.target.value } }),
        value: badHousingSettings.badQuality.source,
      }}
    >
      <option value="" selected disabled hidden>
        Selectionnez une option
      </option>
      <option value="RP">Recensement INSEE</option>
      <option value="FF">Fichiers fonciers</option>
      <option value="Filo">PPPI Noyau dur (CGDD/SDES à partir de données fiscales)</option>
    </Select>
  )
}
