'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'

export const UpdateProjectionPeriod: FC = () => {
  const { simulationSettings, setSimulationSettings } = useSimulationSettings()

  const { projection } = simulationSettings

  const handleChange = (value: string) => setSimulationSettings({ ...simulationSettings, projection: Number(value) })

  return (
    <Range
      label="Faites glisser le curseur pour établir l'horizon de temps du scénario."
      max={2050}
      min={2021}
      nativeInputProps={{
        onChange: (e) => handleChange(e.target.value),
        value: projection,
      }}
    />
  )
}
