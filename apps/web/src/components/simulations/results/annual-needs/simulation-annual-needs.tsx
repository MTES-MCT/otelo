import { AccommodationContructionEvolutionChart } from '~/components/charts/accommodation-construction-evolution-chart'
import { SimulationAnnualsNeedsDropdownSummary } from '~/components/simulations/results/annual-needs/simulation-annual-needs-dropdown-summary'
import { TFlowRequirementChartData, TSitadelData } from '~/schemas/results'

type SimulationAnnualsNeedsSummaryProps = {
  sitadelResults: TSitadelData
  newConstructionsResults: TFlowRequirementChartData
  horizon: number
  hasSurplusHousing: boolean
}

export const SimulationAnnualsNeedsSummary = ({
  sitadelResults,
  newConstructionsResults,
  horizon,
  hasSurplusHousing,
}: SimulationAnnualsNeedsSummaryProps) => {
  return (
    <div className="fr-background-default--grey shadow">
      <div className="fr-py-8w fr-px-5w">
        <AccommodationContructionEvolutionChart
          sitadelResults={sitadelResults}
          newConstructionsResults={newConstructionsResults}
          horizon={horizon}
        />
      </div>
      <SimulationAnnualsNeedsDropdownSummary horizon={horizon} hasSurplusHousing={hasSurplusHousing} />
    </div>
  )
}
