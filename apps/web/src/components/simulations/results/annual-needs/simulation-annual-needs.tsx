import { AccommodationContructionEvolutionChart } from '~/components/charts/accommodation-construction-evolution-chart'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
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
        <ChartDownloadWrapper fileName="besoins-annualises">
          <AccommodationContructionEvolutionChart
            sitadelResults={sitadelResults}
            newConstructionsResults={newConstructionsResults}
            horizon={horizon}
          />
        </ChartDownloadWrapper>
      </div>
      <SimulationAnnualsNeedsDropdownSummary horizon={horizon} hasSurplusHousing={hasSurplusHousing} />
    </div>
  )
}
