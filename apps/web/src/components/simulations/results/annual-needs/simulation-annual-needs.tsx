import { AccommodationContructionEvolutionChart } from '~/components/charts/accommodation-construction-evolution-chart'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
import { SimulationAnnualsNeedsDropdownSummary } from '~/components/simulations/results/annual-needs/simulation-annual-needs-dropdown-summary'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { TFlowRequirementChartData, TSitadelData } from '~/schemas/results'

type SimulationAnnualsNeedsSummaryProps = {
  sitadelResults: TSitadelData
  newConstructionsResults: TFlowRequirementChartData
  horizon: number
  hasSurplusHousing: boolean
  epciName: string
  peakYear?: number
}

export const SimulationAnnualsNeedsSummary = ({
  sitadelResults,
  newConstructionsResults,
  horizon,
  hasSurplusHousing,
  epciName,
  peakYear,
}: SimulationAnnualsNeedsSummaryProps) => {
  if (peakYear === 2021) {
    return null
  }
  return (
    <div className="fr-background-default--grey shadow" {...tutorialAnchor('results-annual-needs')}>
      <div className="fr-py-8w fr-px-5w">
        <ChartDownloadWrapper fileName="besoins-annualises">
          <AccommodationContructionEvolutionChart
            sitadelResults={sitadelResults}
            newConstructionsResults={newConstructionsResults}
            horizon={horizon}
            epciName={epciName}
          />
        </ChartDownloadWrapper>
      </div>
      <SimulationAnnualsNeedsDropdownSummary horizon={horizon} hasSurplusHousing={hasSurplusHousing} />
    </div>
  )
}
