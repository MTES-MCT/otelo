'use client'

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { SimulationPreviewPayload, useSimulationPreview } from '~/hooks/use-simulation-preview'

interface SimulationPeakYearsResult {
  peakYears: Record<string, number>
  minPeakYear: number | null
  projection: number | null
  millesime: number | null
  isLoading: boolean
  enabled: boolean
}

const getPeakYears = (payload: Awaited<ReturnType<typeof useSimulationPreview>>['data']): Record<string, number> => {
  return (
    payload?.flowRequirement?.epcis?.reduce(
      (acc, epci) => {
        acc[epci.code] = epci.data.peakYear
        return acc
      },
      {} as Record<string, number>,
    ) ?? {}
  )
}

const getMinPeakYear = (peakYears: Record<string, number>): number | null => {
  const values = Object.values(peakYears).filter(Boolean)
  return values.length > 0 ? Math.min(...values) : null
}

export const useCreationPeakYears = (): SimulationPeakYearsResult => {
  const [queryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    millesime: parseAsString,
    omphale: parseAsString,
    projection: parseAsInteger,
  })

  const selectedEpciKey = queryStates.epcis.join(',')
  const selectedQueryEpcis = useMemo(() => (selectedEpciKey ? selectedEpciKey.split(',') : []), [selectedEpciKey])

  const payload = useMemo<SimulationPreviewPayload>(() => {
    const scenario: Record<string, unknown> = {}
    if (queryStates.omphale) scenario.b2_scenario = queryStates.omphale
    if (queryStates.projection) scenario.projection = queryStates.projection
    if (queryStates.millesime) scenario.millesime = queryStates.millesime

    return { epcis: selectedQueryEpcis, scenario }
  }, [selectedQueryEpcis, queryStates.omphale, queryStates.projection, queryStates.millesime])

  const enabled = selectedQueryEpcis.length > 0
  const { data, isLoading } = useSimulationPreview(payload, { enabled })
  const peakYears = getPeakYears(data)

  return {
    peakYears,
    minPeakYear: getMinPeakYear(peakYears),
    projection: queryStates.projection,
    millesime: queryStates.millesime ? Number(queryStates.millesime) : null,
    isLoading,
    enabled,
  }
}

export const useModifyPeakYears = (): SimulationPeakYearsResult => {
  const { simulationSettings } = useSimulationSettings()

  const payload = useMemo<SimulationPreviewPayload>(
    () => ({
      simulationId: simulationSettings.simulationId,
      scenario: {
        b2_scenario: simulationSettings.b2_scenario,
        projection: simulationSettings.projection,
        millesime: simulationSettings.millesime,
      },
    }),
    [simulationSettings.simulationId, simulationSettings.b2_scenario, simulationSettings.projection, simulationSettings.millesime],
  )

  const { data, isLoading } = useSimulationPreview(payload)
  const previewPeakYears = getPeakYears(data)
  const peakYears = Object.keys(previewPeakYears).length > 0 ? previewPeakYears : (simulationSettings.peakYears ?? {})

  return {
    peakYears,
    minPeakYear: getMinPeakYear(peakYears),
    projection: simulationSettings.projection,
    millesime: Number(simulationSettings.millesime),
    isLoading,
    enabled: true,
  }
}
