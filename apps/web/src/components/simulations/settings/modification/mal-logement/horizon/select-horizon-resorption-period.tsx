'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'

export const SelectResorptionHorizonPeriod: FC = () => {
  const { badHousingSettings, setBadHousingSettings } = useBadHousingSettings()

  const { horizon } = badHousingSettings

  const handleChange = (value: string) => setBadHousingSettings({ ...badHousingSettings, horizon: Number(value) })

  return (
    <div {...tutorialAnchor('bad-housing-resorption-horizon')}>
      <Range
        hintText="Faites glisser le curseur pour définir l'horizon de résorption de la simulation."
        label="Horizon de résorption de la simulation"
        max={2050}
        min={2030}
        nativeInputProps={{
          onChange: (e) => handleChange(e.target.value),
          value: horizon,
        }}
      />
    </div>
  )
}
