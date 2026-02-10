import { TEpcisAccommodationRates } from '@shared'
import { createContext, useContext, useState } from 'react'
import { TScenario } from '~/schemas/scenario'

export interface SimulationInitialSettings {
  id: string
  projection: number
  simulationId: string
  b2_scenario: string
  epciScenarios: TScenario['epciScenarios']
}

export interface SimulationSettings {
  id: string
  projection: number
  simulationId: string
  b2_scenario: string
  epciScenarios: TEpcisAccommodationRates
}

interface SimulationSettingsState {
  simulationSettings: SimulationSettings
  setSimulationSettings: (settings: SimulationSettings) => void
  updateRates: (epciId: string, newRates: Partial<TEpcisAccommodationRates[string]>) => void
  updateAllRates: (newRatesPerEpci: Record<string, Partial<TEpcisAccommodationRates[string]>>) => void
}

export const SimulationSettingsContext = createContext<SimulationSettingsState | undefined>(undefined)

function transformInitialSettings(initialSettings: SimulationInitialSettings): SimulationSettings {
  const epciScenariosRecord = initialSettings.epciScenarios.reduce((acc, scenario) => {
    acc[scenario.epciCode] = {
      vacancyRate: scenario.b2_tx_vacance_longue + scenario.b2_tx_vacance_courte,
      longTermVacancyRate: scenario.b2_tx_vacance_longue,
      shortTermVacancyRate: scenario.b2_tx_vacance_courte,
      txRs: scenario.b2_tx_rs,
      urbanRenewal: 0,
      vacancy: {
        nbAccommodation: 0,
        year: undefined,
      },
      restructuringRate: scenario.b2_tx_restructuration,
      disappearanceRate: scenario.b2_tx_disparition,
      totalVacantCount: 0,
      longTermVacantCount: 0,
    }
    return acc
  }, {} as TEpcisAccommodationRates)

  return {
    ...initialSettings,
    epciScenarios: epciScenariosRecord,
  }
}

export const SimulationSettingsProvider = ({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: SimulationInitialSettings
}) => {
  const transformedSettings = transformInitialSettings(initialSettings)
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>(transformedSettings)

  const updateRates = (epciId: string, newRates: Partial<TEpcisAccommodationRates[string]>) => {
    setSimulationSettings((prevSettings) => ({
      ...prevSettings,
      epciScenarios: {
        ...prevSettings.epciScenarios,
        [epciId]: {
          ...prevSettings.epciScenarios[epciId],
          ...newRates,
        },
      },
    }))
  }

  const updateAllRates = (newRatesPerEpci: Record<string, Partial<TEpcisAccommodationRates[string]>>) => {
    setSimulationSettings((prevSettings) => {
      const updatedScenarios = { ...prevSettings.epciScenarios }
      for (const [epciId, newRates] of Object.entries(newRatesPerEpci)) {
        updatedScenarios[epciId] = { ...updatedScenarios[epciId], ...newRates }
      }
      return {
        ...prevSettings,
        epciScenarios: updatedScenarios,
      }
    })
  }

  return (
    <SimulationSettingsContext.Provider value={{ simulationSettings, setSimulationSettings, updateRates, updateAllRates }}>
      {children}
    </SimulationSettingsContext.Provider>
  )
}

export const useSimulationSettings = () => {
  const context = useContext(SimulationSettingsContext)
  if (context === undefined) {
    throw new Error('useSimulationSettings must be used within a SimulationSettingsProvider')
  }
  return context
}
