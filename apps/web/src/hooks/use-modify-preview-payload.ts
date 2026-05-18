'use client'

import { useMemo } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { SimulationPreviewPayload } from '~/hooks/use-simulation-preview'

export const useModifyPreviewPayload = (): SimulationPreviewPayload => {
  const { simulationSettings } = useSimulationSettings()

  return useMemo<SimulationPreviewPayload>(() => {
    const epciScenarios: Record<string, Record<string, unknown>> = {}
    for (const [code, rates] of Object.entries(simulationSettings.epciScenarios)) {
      epciScenarios[code] = {
        b2_tx_rs: rates.txRs,
        b2_tx_vacance: rates.vacancyRate,
        b2_tx_vacance_longue: rates.longTermVacancyRate,
        b2_tx_vacance_courte: rates.shortTermVacancyRate,
        b2_tx_restructuration: rates.restructuringRate,
        b2_tx_disparition: rates.disappearanceRate,
      }
    }
    return {
      simulationId: simulationSettings.simulationId,
      scenario: {
        b2_scenario: simulationSettings.b2_scenario,
        projection: simulationSettings.projection,
        millesime: simulationSettings.millesime,
      },
      epciScenarios,
    }
  }, [simulationSettings])
}
