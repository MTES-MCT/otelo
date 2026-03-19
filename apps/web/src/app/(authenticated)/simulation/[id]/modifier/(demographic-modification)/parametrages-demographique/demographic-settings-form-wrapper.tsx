'use client'

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
import { OmphaleScenariosChart } from '~/components/charts/omphale-scenarios-chart'
import { PopulationScenariosChart } from '~/components/charts/population-scenarios-chart'
import { DemographicSettingsHeader } from '~/components/simulations/settings/demographic-settings-header'
import { TOmphaleDemographicEvolution, TPopulationDemographicEvolution } from '~/schemas/demographic-evolution'

const getPopulationFromScenario = (b2Scenario: string): string | null => {
  if (b2Scenario.startsWith('PH_')) return 'haute'
  if (b2Scenario.startsWith('Central_')) return 'central'
  if (b2Scenario.startsWith('PB_')) return 'basse'
  return null
}

type DemographicSettingsFormWrapperProps = {
  populationEvolution: TPopulationDemographicEvolution
  omphaleEvolution: TOmphaleDemographicEvolution
  epcis: string[]
  scenarioId: string
}

export const DemographicSettingsFormWrapper = ({
  epcis,
  populationEvolution,
  omphaleEvolution,
  scenarioId,
}: DemographicSettingsFormWrapperProps) => {
  const [queryStates, setQueryStates] = useQueryStates({
    epciChart: parseAsString,
    population: parseAsString,
    omphale: parseAsString,
    millesime: parseAsInteger,
    projection: parseAsString,
  })
  const { simulationSettings, setSimulationSettings } = useSimulationSettings()
  const handleChange = (value: string) =>
    setSimulationSettings({
      ...simulationSettings,
      b2_scenario: value,
    })

  useEffect(() => {
    if (!queryStates.epciChart) {
      setQueryStates({ epciChart: epcis[0] })
    }
  }, [epcis, queryStates.epciChart, setQueryStates])

  useEffect(() => {
    const updates: Record<string, string | number | null> = {}
    if (simulationSettings.b2_scenario) {
      if (!queryStates.population) {
        const derivedPopulation = getPopulationFromScenario(simulationSettings.b2_scenario)
        if (derivedPopulation) {
          updates.population = derivedPopulation
        }
      }
      if (!queryStates.omphale) {
        updates.omphale = simulationSettings.b2_scenario
      }
    }
    if (!queryStates.millesime && simulationSettings.millesime) {
      updates.millesime = Number(simulationSettings.millesime)
    }
    if (!queryStates.projection && simulationSettings.projection) {
      updates.projection = String(simulationSettings.projection)
    }
    if (Object.keys(updates).length > 0) {
      setQueryStates(updates)
    }
  }, [])

  useEffect(() => {
    if (queryStates.omphale && queryStates.omphale !== simulationSettings.b2_scenario) {
      setSimulationSettings({
        ...simulationSettings,
        b2_scenario: queryStates.omphale,
      })
    }
  }, [queryStates.omphale])

  if (!queryStates.epciChart) return null

  return (
    <DemographicSettingsHeader>
      <ChartDownloadWrapper fileName="scenarios-population">
        <PopulationScenariosChart demographicEvolution={populationEvolution} epcis={epcis} />
      </ChartDownloadWrapper>
      <ChartDownloadWrapper fileName="scenarios-omphale">
        <OmphaleScenariosChart demographicEvolution={omphaleEvolution} scenarioId={scenarioId} onChange={handleChange} epcis={epcis} />
      </ChartDownloadWrapper>
    </DemographicSettingsHeader>
  )
}
