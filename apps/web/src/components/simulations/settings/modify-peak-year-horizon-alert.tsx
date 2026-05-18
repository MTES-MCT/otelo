'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { PeakYearHorizonAlert } from './peak-year-horizon-alert'

export const ModifyPeakYearHorizonAlert: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const peakYearValues = Object.values(simulationSettings.peakYears ?? {})
  const minPeakYear = peakYearValues.length > 0 ? Math.min(...peakYearValues) : null

  return <PeakYearHorizonAlert peakYear={minPeakYear} projection={simulationSettings.projection} />
}
