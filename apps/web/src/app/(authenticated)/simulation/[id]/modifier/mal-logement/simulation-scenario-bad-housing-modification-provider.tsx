import { createContext, useContext, useState } from 'react'

export interface BadHousingSettings {
  badQuality: {
    confort: string
    occupation: string
    part: number
    source: string
  }
  heberges: {
    part: number
    particular: boolean
    temporary: boolean
  }
  horizon: number
  horsLogement: {
    accommodationTypes: string[]
    fortune: boolean
    hotel: boolean
    part: number
    sa: boolean
    source: string
  }
  id: string
  inadequationFinanciere: {
    accedant: boolean
    maxEffort: number
    part: number
    plp: boolean
  }
  simulationId: string
  suroccupation: {
    part: number
    plp: boolean
    proprietaire: boolean
    source: string
    surocc: string
  }
}

interface BadHousingSettingsState {
  badHousingSettings: BadHousingSettings
  setBadHousingSettings: (settings: BadHousingSettings) => void
}

export const BadHousingSettingsContext = createContext<BadHousingSettingsState | undefined>(undefined)

export const BadHousingSettingsProvider = ({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: BadHousingSettings
}) => {
  const [badHousingSettings, setBadHousingSettings] = useState<BadHousingSettings>(initialSettings)

  return (
    <BadHousingSettingsContext.Provider value={{ badHousingSettings, setBadHousingSettings }}>
      {children}
    </BadHousingSettingsContext.Provider>
  )
}

export const useBadHousingSettings = () => {
  const context = useContext(BadHousingSettingsContext)
  if (context === undefined) {
    throw new Error('useBadHousingSettings must be used within a BadHousingSettingsProvider')
  }
  return context
}
