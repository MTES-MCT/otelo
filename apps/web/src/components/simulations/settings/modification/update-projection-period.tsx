'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC, useEffect } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { clampProjectionYear, getMinProjectionYear, MAX_PROJECTION_YEAR } from '~/utils/projection'

export const UpdateProjectionPeriod: FC = () => {
  const { simulationSettings, setSimulationSettings } = useSimulationSettings()

  const { projection, millesime } = simulationSettings
  const minYear = getMinProjectionYear(millesime)
  const projectionValue = clampProjectionYear(projection, millesime)

  const handleChange = (value: string) => setSimulationSettings({ ...simulationSettings, projection: Number(value) })

  // Rattrape les scénarios enregistrés avant que la borne millésime + 1 ne soit appliquée.
  useEffect(() => {
    if (projection !== projectionValue) {
      setSimulationSettings({ ...simulationSettings, projection: projectionValue })
    }
  }, [projection, projectionValue, simulationSettings, setSimulationSettings])

  return (
    <>
      <Range
        label="Faites glisser le curseur pour établir l'horizon de temps du scénario."
        max={MAX_PROJECTION_YEAR}
        min={minYear}
        nativeInputProps={{
          onChange: (e) => handleChange(e.target.value),
          value: projectionValue,
        }}
      />
      <p className="fr-text--sm fr-mt-1w fr-text-mention--grey">
        Période de projection : 1er janvier {millesime} au 1er janvier {projectionValue}
      </p>
    </>
  )
}
