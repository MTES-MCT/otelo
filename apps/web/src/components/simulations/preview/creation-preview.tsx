'use client'

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC, useMemo } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { SimulationPreview } from '~/components/simulations/preview/simulation-preview'
import { SimulationPreviewPayload } from '~/hooks/use-simulation-preview'

export const CreationPreview: FC = () => {
  const { rates } = useEpcisRates()

  const [queryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    millesime: parseAsString,
    omphale: parseAsString,
    projection: parseAsInteger,
    baseEpci: parseAsString,
  })

  const selectedEpcis = queryStates.epcis.length > 0 ? queryStates.epcis : Object.keys(rates)

  const payload = useMemo<SimulationPreviewPayload>(() => {
    const epciScenarios: Record<string, Record<string, unknown>> = {}
    for (const code of selectedEpcis) {
      const r = rates[code]
      if (!r) continue
      epciScenarios[code] = {
        b2_tx_rs: r.txRS,
        b2_tx_vacance: r.vacancyRate,
        b2_tx_vacance_longue: r.longTermVacancyRate,
        b2_tx_vacance_courte: r.shortTermVacancyRate,
        b2_tx_restructuration: r.restructuringRate,
        b2_tx_disparition: r.disappearanceRate,
        baseEpci: queryStates.baseEpci === code,
      }
    }
    const scenario: Record<string, unknown> = {}
    if (queryStates.omphale) scenario.b2_scenario = queryStates.omphale
    if (queryStates.projection) scenario.projection = queryStates.projection
    if (queryStates.millesime) scenario.millesime = queryStates.millesime

    return {
      epcis: selectedEpcis,
      scenario,
      epciScenarios,
    }
  }, [rates, selectedEpcis, queryStates.omphale, queryStates.projection, queryStates.millesime, queryStates.baseEpci])

  const enabled = selectedEpcis.length > 0

  return <SimulationPreview payload={payload} enabled={enabled} />
}
