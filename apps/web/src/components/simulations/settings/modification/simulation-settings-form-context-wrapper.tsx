'use client'

import { SimulationSettingsProvider } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useScenario } from '~/hooks/use-scenario'

interface SimulationSettingsFormContextWrapperProps {
  children: React.ReactNode
  peakYears?: Record<string, number>
}

export const SimulationSettingsFormContextWrapper = ({ children, peakYears }: SimulationSettingsFormContextWrapperProps) => {
  const { data } = useScenario()
  if (!data) return null
  const { id, scenario } = data

  const initialSettings = {
    id: scenario.id,
    projection: scenario.projection,
    peakYears,
    simulationId: id,
    b2_scenario: scenario.b2_scenario,
    millesime: scenario.millesime,
    epciScenarios: scenario.epciScenarios,
  }

  return <SimulationSettingsProvider initialSettings={initialSettings}>{children}</SimulationSettingsProvider>
}
