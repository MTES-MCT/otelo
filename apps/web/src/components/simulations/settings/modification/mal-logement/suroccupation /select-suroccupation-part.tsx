'use client'

import Range from '@codegouvfr/react-dsfr/Range'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectSuroccupationPart = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()

  return (
    <Range
      label="Part de logements réalloués"
      max={100}
      min={0}
      nativeInputProps={{
        onChange: (e) =>
          setBadHousingSettings({
            ...badHousingSettings,
            suroccupation: { ...badHousingSettings.suroccupation, part: Number(e.target.value) },
          }),
        value: badHousingSettings.suroccupation.part,
      }}
    />
  )
}
