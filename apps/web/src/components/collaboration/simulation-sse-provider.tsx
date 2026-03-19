'use client'

import { createContext, useContext } from 'react'
import { useSimulationSSE } from '~/hooks/use-simulation-sse'

interface SimulationSSEContextValue {
  clientId: string
}

const SimulationSSEContext = createContext<SimulationSSEContextValue | null>(null)

function SimulationSSEProviderInner({ simulationId, children }: { simulationId: string; children: React.ReactNode }) {
  const sseState = useSimulationSSE(simulationId)

  return <SimulationSSEContext.Provider value={sseState}>{children}</SimulationSSEContext.Provider>
}

export function SimulationSSEProvider({
  simulationId,
  enabled = true,
  children,
}: {
  simulationId: string
  enabled?: boolean
  children: React.ReactNode
}) {
  if (!enabled) {
    return <SimulationSSEContext.Provider value={null}>{children}</SimulationSSEContext.Provider>
  }

  return <SimulationSSEProviderInner simulationId={simulationId}>{children}</SimulationSSEProviderInner>
}

export function useSimulationSSEContext() {
  return useContext(SimulationSSEContext)
}
