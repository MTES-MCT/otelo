'use client'

import Range from '@codegouvfr/react-dsfr/Range'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectBadQualityPart = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Range
      label="Part de logements rénovés"
      max={100}
      min={0}
      nativeInputProps={{
        onChange: (e) =>
          setBadHousingSettings({ ...badHousingSettings, badQuality: { ...badHousingSettings.badQuality, part: Number(e.target.value) } }),
        value: badHousingSettings.badQuality.part,
      }}
    />
  )
}
