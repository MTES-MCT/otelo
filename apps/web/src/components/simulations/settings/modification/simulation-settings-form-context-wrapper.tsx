'use client'

import { SimulationSettingsProvider } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useScenario } from '~/hooks/use-scenario'

interface SimulationSettingsFormContextWrapperProps {
  children: React.ReactNode
}

export const SimulationSettingsFormContextWrapper = ({ children }: SimulationSettingsFormContextWrapperProps) => {
  const { data } = useScenario()
  if (!data) return null
  const { id, scenario } = data

  const initialSettings = {
    id: scenario.id,
    projection: scenario.projection,
    simulationId: id,
    b2_scenario: scenario.b2_scenario,
    epciScenarios: scenario.epciScenarios,
  }

  return <SimulationSettingsProvider initialSettings={initialSettings}>{children}</SimulationSettingsProvider>
}
