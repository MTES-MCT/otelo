'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
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
  const [epciChart, setEpciChart] = useQueryState('epciChart')
  const [population, setPopulation] = useQueryState('population', parseAsString)
  const [omphale, setOmphale] = useQueryState('omphale', parseAsString)
  const { simulationSettings, setSimulationSettings } = useSimulationSettings()
  const handleChange = (value: string) =>
    setSimulationSettings({
      ...simulationSettings,
      b2_scenario: value,
    })

  useEffect(() => {
    if (!epciChart) {
      setEpciChart(epcis[0])
    }
  }, [epcis, epciChart, setEpciChart])

  useEffect(() => {
    if (simulationSettings.b2_scenario) {
      if (!population) {
        const derivedPopulation = getPopulationFromScenario(simulationSettings.b2_scenario)
        if (derivedPopulation) {
          setPopulation(derivedPopulation)
        }
      }
      if (!omphale) {
        setOmphale(simulationSettings.b2_scenario)
      }
    }
  }, [])

  useEffect(() => {
    if (omphale && omphale !== simulationSettings.b2_scenario) {
      setSimulationSettings({
        ...simulationSettings,
        b2_scenario: omphale,
      })
    }
  }, [omphale])

  if (!epciChart) return null

  return (
    <DemographicSettingsHeader>
      <PopulationScenariosChart demographicEvolution={populationEvolution} epcis={epcis} />
      <OmphaleScenariosChart demographicEvolution={omphaleEvolution} scenarioId={scenarioId} onChange={handleChange} epcis={epcis} />
    </DemographicSettingsHeader>
  )
}
