'use client'

import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useModifyPreviewPayload } from '~/hooks/use-modify-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { PeakYearHorizonAlert } from './peak-year-horizon-alert'

export const ModifyPeakYearHorizonAlert: FC = () => {
  const { simulationSettings } = useSimulationSettings()
  const payload = useModifyPreviewPayload()
  const { data, isLoading } = useSimulationPreview(payload)

  if (isLoading) return <LoadingSpinner />

  const rawPeakYears = data?.flowRequirement?.epcis?.map((e) => e.data.peakYear) ?? Object.values(simulationSettings.peakYears ?? {})
  const peakYearValues = rawPeakYears.filter(Boolean)
  const minPeakYear = peakYearValues.length > 0 ? Math.min(...peakYearValues) : null
  const millesime = simulationSettings.millesime ? Number(simulationSettings.millesime) : null

  return <PeakYearHorizonAlert peakYear={minPeakYear} projection={simulationSettings.projection} millesime={millesime} />
}
