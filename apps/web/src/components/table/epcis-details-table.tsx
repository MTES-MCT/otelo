import Table from '@codegouvfr/react-dsfr/Table'
import { TEpciTotalCalculationResult, TFlowRequirementChartData } from '~/schemas/results'
import { TSimulationWithResults } from '~/schemas/simulation'
import { calculateFlowResultsForEpci } from '~/utils/calculation-helpers'
import { formatNumber } from '~/utils/format-numbers'

type EpcisDetailsTableProps = {
  simulation: TSimulationWithResults
}

export const EpcisDetailsTable = ({ simulation }: EpcisDetailsTableProps) => {
  const tableData = simulation.epcis.map((epci) => {
    const epciFlowRequirement = simulation.results.flowRequirement.epcis.find((e) => e.code === epci.code) as TFlowRequirementChartData
    const epciTotalResults = simulation.results.epcisTotals.find((e) => e.epciCode === epci.code) as TEpciTotalCalculationResult
    const total = epciTotalResults.total
    const totalFlux = epciTotalResults.totalFlux
    const totalStock = epciFlowRequirement.data.peakYear === 2021 ? epciTotalResults.totalStock : epciTotalResults.prepeakTotalStock

    const flowRequirementsEpci = simulation.results.flowRequirement.epcis.find((e) => e.code === epci.code) as TFlowRequirementChartData
    const flowResults = calculateFlowResultsForEpci(flowRequirementsEpci, totalFlux)
    return [
      epci.name,
      formatNumber(flowResults.totalFlux),
      formatNumber(totalStock),
      formatNumber(total),
      flowResults.longTermVacantAccomodation < 0 ? formatNumber(Math.abs(flowResults.longTermVacantAccomodation)) : 0, // Logements vacants à remobiliser
      flowResults.secondaryResidenceAccomodationEvolution < 0
        ? formatNumber(Math.abs(flowResults.secondaryResidenceAccomodationEvolution))
        : 0,
      `2021 - ${flowRequirementsEpci.data.peakYear === 2021 ? simulation.scenario.b1_horizon_resorption : flowRequirementsEpci.data.peakYear !== 2050 ? flowRequirementsEpci.data.peakYear : simulation.scenario.projection}`,
    ]
  })

  return (
    <Table
      caption="Détails des besoins en logements supplémentaires par EPCI"
      headers={[
        'EPCI',
        'Démographie et évolution du parc',
        'Situations de mal logement',
        'Constructions neuves',
        'Remobilisation de logements vacants',
        'Remobilisation de résidences secondaires',
        'Période considérée',
      ]}
      data={tableData}
      fixed
    />
  )
}
