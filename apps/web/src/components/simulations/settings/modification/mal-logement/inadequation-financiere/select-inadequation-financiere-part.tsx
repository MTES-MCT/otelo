'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'

export const SelectInadequationFinancierePart = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()
  return (
    <Range
      label="Part des logements réalloués"
      max={100}
      min={0}
      nativeInputProps={{
        onChange: (e) =>
          setBadHousingSettings({
            ...badHousingSettings,
            inadequationFinanciere: { ...badHousingSettings.inadequationFinanciere, part: Number(e.target.value) },
          }),
        value: badHousingSettings.inadequationFinanciere.part,
      }}
    />
  )
}
