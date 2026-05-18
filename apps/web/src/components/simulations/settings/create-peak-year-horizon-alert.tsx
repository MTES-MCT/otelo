'use client'

import { FC } from 'react'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { PeakYearHorizonAlert } from './peak-year-horizon-alert'

export const CreatePeakYearHorizonAlert: FC = () => {
  const { payload, enabled } = useCreationPreviewPayload()
  const { data, isLoading } = useSimulationPreview(payload, { enabled })

  if (isLoading) return <LoadingSpinner />

  const peakYearValues = data?.flowRequirement?.epcis?.map((e) => e.data.peakYear).filter(Boolean) ?? []
  const minPeakYear = peakYearValues.length > 0 ? Math.min(...peakYearValues) : null
  const millesime = payload.scenario?.millesime ? Number(payload.scenario.millesime) : null

  return <PeakYearHorizonAlert peakYear={minPeakYear} projection={payload.scenario?.projection as number | null} millesime={millesime} />
}
