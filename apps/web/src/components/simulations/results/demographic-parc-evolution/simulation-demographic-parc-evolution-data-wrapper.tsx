'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
import { FlowRequirementsChart } from '~/components/charts/flow-requirements-char'
import { DemographicEvolutionResultsTable } from '~/components/simulations/results/demographic-evolution-results-table'
import { SimulationDemographicParcEvolutionProps } from '~/components/simulations/results/demographic-parc-evolution/simulation-demographic-parc-evolution'
import styles from './simulation-demographic-parc-evolution-data-wrapper.module.css'

export const SimulationParcEvolutionDataWrapper = ({ results, horizon }: SimulationDemographicParcEvolutionProps) => {
  const [queryState] = useQueryState('demographie', parseAsString.withDefault('graphique'))

  if (queryState === 'graphique') {
    return (
      <ChartDownloadWrapper className={styles.exportAsImageButton} fileName="demographie-parc-evolution">
        <FlowRequirementsChart results={results} horizon={horizon} />
      </ChartDownloadWrapper>
    )
  }

  if (queryState === 'tableau') {
    return <DemographicEvolutionResultsTable results={results} />
  }

  return null
}
