'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectNoAccomodationPart = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Range
      label="Part prise en compte"
      max={100}
      min={0}
      nativeInputProps={{
        onChange: (e) =>
          setBadHousingSettings({
            ...badHousingSettings,
            horsLogement: { ...badHousingSettings.horsLogement, part: Number(e.target.value) },
          }),
        value: badHousingSettings.horsLogement.part,
      }}
    />
  )
}
