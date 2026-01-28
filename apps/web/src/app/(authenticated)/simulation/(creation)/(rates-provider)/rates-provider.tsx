import React, { createContext, useContext, useEffect, useState } from 'react'
import { TAccommodationRates } from '@shared'

export interface RateSettings {
  vacancyRate: number
  longTermVacancyRate: number
  shortTermVacancyRate: number
  txRS: number
  restructuringRate: number
  disappearanceRate: number
}

interface RatesState {
  rates: Record<string, RateSettings>
  defaultRates: Record<string, RateSettings>
  updateRates: (epciId: string, newRates: Partial<RateSettings>) => void
  updateAllRates: (newRatesPerEpci: Record<string, Partial<RateSettings>>) => void
}

export const RatesSettingsContext = createContext<RatesState | undefined>(undefined)

interface RatesProviderProps {
  children: React.ReactNode
  initialRates?: Record<string, TAccommodationRates>
}

export const RatesProvider = ({ children, initialRates }: RatesProviderProps) => {
  const transformedInitialRates: Record<string, RateSettings> = Object.entries(initialRates || {}).reduce((acc, [epciId, rates]) => {
    return {
      ...acc,
      [epciId]: {
        vacancyRate: rates.vacancyRate,
        longTermVacancyRate: rates.longTermVacancyRate,
        shortTermVacancyRate: rates.shortTermVacancyRate,
        txRS: rates.txRs,
        initialRates: rates,
        restructuringRate: rates.restructuringRate,
        disappearanceRate: rates.disappearanceRate,
      },
    }
  }, {})

  const [rates, setRates] = useState<Record<string, RateSettings>>(transformedInitialRates)
  const [defaultRates, setDefaultRates] = useState<Record<string, RateSettings>>(transformedInitialRates)

  useEffect(() => {
    const newTransformedRates = Object.entries(initialRates || {}).reduce((acc, [epciId, rateData]) => {
      return {
        ...acc,
        [epciId]: {
          vacancyRate: rateData.vacancyRate,
          longTermVacancyRate: rateData.longTermVacancyRate,
          shortTermVacancyRate: rateData.shortTermVacancyRate,
          txRS: rateData.txRs,
          initialRates: rateData,
          restructuringRate: rateData.restructuringRate,
          disappearanceRate: rateData.disappearanceRate,
        },
      }
    }, {})

    setRates(newTransformedRates)
    setDefaultRates(newTransformedRates)
  }, [initialRates])

  const updateRates = (epciId: string, newRates: Partial<RateSettings>) => {
    setRates((prevRates) => ({
      ...prevRates,
      [epciId]: {
        ...prevRates[epciId],
        ...newRates,
      },
    }))
  }

  const updateAllRates = (newRatesPerEpci: Record<string, Partial<RateSettings>>) => {
    setRates((prevRates) => {
      const updated = { ...prevRates }
      for (const [epciId, newRates] of Object.entries(newRatesPerEpci)) {
        updated[epciId] = { ...updated[epciId], ...newRates }
      }
      return updated
    })
  }

  return (
    <RatesSettingsContext.Provider
      value={{
        rates,
        updateRates,
        updateAllRates,
        defaultRates,
      }}
    >
      {children}
    </RatesSettingsContext.Provider>
  )
}

export const useEpcisRates = () => {
  const context = useContext(RatesSettingsContext)
  if (context === undefined) {
    throw new Error('useEpcisRates must be used within a RatesProvider')
  }
  return context
}
