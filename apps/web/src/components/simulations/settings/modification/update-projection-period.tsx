'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC, useEffect } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { ReadingKey } from '~/components/ui/reading-key'
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
        label="Horizon de temps"
        prefix="1er janvier "
        max={MAX_PROJECTION_YEAR}
        min={minYear}
        nativeInputProps={{
          onChange: (e) => handleChange(e.target.value),
          value: projectionValue,
        }}
      />
      <ReadingKey className="fr-mt-4w">
        Votre estimation portera du <strong>1er janvier {millesime}</strong> au <strong>1er janvier {projectionValue}</strong>.
      </ReadingKey>
    </>
  )
}
