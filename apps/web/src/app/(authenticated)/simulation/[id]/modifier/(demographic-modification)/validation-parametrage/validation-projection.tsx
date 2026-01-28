'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'

export const ValidationProjection = () => {
  const { simulationSettings } = useSimulationSettings()
  const { projection } = simulationSettings
  return (
    <Input
      disabled
      label=""
      iconId="ri-calendar-line"
      hintText="Année de projection"
      style={{ flex: 1 }}
      nativeInputProps={{ value: projection }}
    />
  )
}
