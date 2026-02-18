'use client'

import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { RatesProvider } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

interface SimulationFormContextWrapperProps {
  children: React.ReactNode
  epcis?: string[]
}

export const SimulationFormRatesProviderContextWrapper = ({ children, epcis }: SimulationFormContextWrapperProps) => {
  const [queryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    millesime: parseAsString,
    type: parseAsString,
  })
  const epcisCodes = epcis ?? queryStates.epcis

  const { data: accommodationRates } = useAccommodationRatesByEpci(epcisCodes, queryStates.millesime || undefined)

  return <RatesProvider initialRates={accommodationRates || {}}>{children}</RatesProvider>
}
