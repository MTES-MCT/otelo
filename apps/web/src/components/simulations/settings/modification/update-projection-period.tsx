'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'

export const UpdateProjectionPeriod: FC = () => {
  const { simulationSettings, setSimulationSettings } = useSimulationSettings()

  const { projection, millesime } = simulationSettings
  const minYear = millesime ? Number(millesime) : 2021

  const handleChange = (value: string) => setSimulationSettings({ ...simulationSettings, projection: Number(value) })

  return (
    <>
      <Range
        label="Faites glisser le curseur pour établir l'horizon de temps du scénario."
        max={2050}
        min={minYear}
        nativeInputProps={{
          onChange: (e) => handleChange(e.target.value),
          value: projection,
        }}
      />
      <p className="fr-text--sm fr-mt-1w fr-text-mention--grey">Période de projection : 1er janvier {millesime} au 1er janvier {projection}</p>
    </>
  )
}
