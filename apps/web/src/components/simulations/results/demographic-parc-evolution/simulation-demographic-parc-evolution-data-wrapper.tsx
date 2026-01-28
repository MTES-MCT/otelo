'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { FlowRequirementsChart } from '~/components/charts/flow-requirements-char'
import { DemographicEvolutionResultsTable } from '~/components/simulations/results/demographic-evolution-results-table'
import { SimulationDemographicParcEvolutionProps } from '~/components/simulations/results/demographic-parc-evolution/simulation-demographic-parc-evolution'

export const SimulationParcEvolutionDataWrapper = ({ results, horizon }: SimulationDemographicParcEvolutionProps) => {
  const [queryState] = useQueryState('demographie', parseAsString.withDefault('graphique'))

  if (queryState === 'graphique') {
    return <FlowRequirementsChart results={results} horizon={horizon} />
  }

  if (queryState === 'tableau') {
    return <DemographicEvolutionResultsTable results={results} />
  }

  return null
}
