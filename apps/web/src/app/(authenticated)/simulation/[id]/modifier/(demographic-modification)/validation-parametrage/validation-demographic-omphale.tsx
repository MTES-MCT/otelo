'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { getOmphaleLabel } from '~/utils/omphale-label'

export const ValidationDemographicOmphale = () => {
  const { simulationSettings } = useSimulationSettings()
  const { b2_scenario } = simulationSettings
  return (
    <Input
      disabled
      label=""
      iconId="ri-calendar-line"
      hintText="Année de projection"
      style={{ flex: 1 }}
      nativeInputProps={{ value: getOmphaleLabel(b2_scenario) as string }}
    />
  )
}
