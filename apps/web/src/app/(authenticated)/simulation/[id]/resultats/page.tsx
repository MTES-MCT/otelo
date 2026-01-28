import Button from '@codegouvfr/react-dsfr/Button'
import { RiIconClassName } from '@codegouvfr/react-dsfr/fr/generatedFromCss/classNames'
import { SimulationAnnualsNeedsSummary } from '~/components/simulations/results/annual-needs/simulation-annual-needs'
import { SimulationBadHousing } from '~/components/simulations/results/bad-housing/simulation-bad-housing'
import { SimulationDemographicBadHousingSummary } from '~/components/simulations/results/demographic-bad-housing/simulation-demographic-bad-housing-summary'
import { SimulationDemographicParcEvolution } from '~/components/simulations/results/demographic-parc-evolution/simulation-demographic-parc-evolution'
import { ExportExcelSimulationButton } from '~/components/simulations/results/export-simulation-settings-button'
import { SimulationHeaderSegmentedControls } from '~/components/simulations/results/header/simulation-header-segmented-controls'
import { SimulationHeaderTitle } from '~/components/simulations/results/header/simulation-header-title'
import { SimulationSettingsDropdown } from '~/components/simulations/results/header/simulation-settings-dropdown'
import { SimulationSecondaryVacantsAccommodationsSummary } from '~/components/simulations/results/secondary-vacants-accommodation/simulation-secondary-vacants-accommodations-summary'
import { SimulationEpcisDetails } from '~/components/simulations/results/simulation-epcis-details'
import { SimulationResultsTabs } from '~/components/simulations/results/simulation-results-tabs'
import { SimulationNeedsSummary } from '~/components/simulations/results/summary/simulation-needs-summary'
import { TEpciCalculationResult, TEpciTotalCalculationResult, TFlowRequirementChartData, TSitadelData } from '~/schemas/results'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import { calculateFlowResultsForEpci } from '~/utils/calculation-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Resultats({ params }: SimulationPageProps) {
  const { id } = await params
  const { name, simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]

  const results = {
    badQuality: simulation.results.badQuality.total,
    total: simulation.results.total,
    totalFlux: simulation.results.totalFlux,
    totalStock: simulation.results.totalStock,
    secondaryAccommodation: simulation.results.secondaryAccommodation,
    vacancy: simulation.results.vacantAccomodation,
  }

  const epciTabs = simulation.epcis.map((epci) => {
    const epciTotals = simulation.results.epcisTotals.find((e) => e.epciCode === epci.code) as TEpciTotalCalculationResult
    const badQuality = (simulation.results.badQuality.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).value
    const prepeakTotalStock = epciTotals.prepeakTotalStock
    const postpeakTotalStock = epciTotals.postpeakTotalStock
    const totalStock = epciTotals.totalStock
    const totalFlux = epciTotals.totalFlux
    const epciFlowRequirementData = simulation.results.flowRequirement.epcis.find((e) => e.code === epci.code) as TFlowRequirementChartData
    const epciResults = {
      badQuality,
      total: epciTotals.total,
      totalFlux,
      totalStock,
      secondaryAccommodation: epciFlowRequirementData.totals.secondaryResidenceAccomodationEvolution,
      vacancy: epciFlowRequirementData.totals.longTermVacantAccomodation,
    }

    const stockResults = {
      badQuality: (simulation.results.badQuality.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).prorataValue,
      financialInadequation: (
        simulation.results.financialInadequation.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult
      ).prorataValue,
      hosted: (simulation.results.hosted.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult).prorataValue,
      noAccomodation: (simulation.results.noAccomodation.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult)
        .prorataValue,
      physicalInadequation: (simulation.results.physicalInadequation.epcis.find((e) => e.epciCode === epci.code) as TEpciCalculationResult)
        .prorataValue,
      totalStock,
    }

    const flowResults = calculateFlowResultsForEpci(
      simulation.results.flowRequirement.epcis.find((e) => e.code === epci.code) as TFlowRequirementChartData,
      totalFlux,
    )

    const sitadelResults = simulation.results.sitadel.epcis.find((e) => e.code === epci.code) as TSitadelData
    const hasNewHousingNeeds = epciResults.totalFlux > 0
    const hasSurplusHousing = Object.values(epciFlowRequirementData.data.surplusHousing).some((value) => value !== 0)
    const epciData = {
      name: epci.name,
      code: epci.code,
      peakYear: epciFlowRequirementData.data.peakYear,
      prepeakTotalStock,
      postpeakTotalStock,
    }
    return {
      content: (
        <div className="fr-container fr-flex fr-direction-column fr-flex-gap-8v">
          <SimulationSettingsDropdown simulation={simulation} epci={epci} />
          <SimulationNeedsSummary projection={simulation.scenario.projection} results={epciResults} epci={epciData} />
          <SimulationDemographicBadHousingSummary
            simulationId={simulation.id}
            totalFlux={epciResults.totalFlux}
            totalStock={epciResults.totalStock}
            epci={epciData}
          />
          {hasNewHousingNeeds && <SimulationSecondaryVacantsAccommodationsSummary results={epciResults} epci={epciData} />}
          <SimulationAnnualsNeedsSummary
            sitadelResults={sitadelResults}
            newConstructionsResults={epciFlowRequirementData}
            horizon={simulation.scenario.projection}
            hasSurplusHousing={hasSurplusHousing}
          />
          {hasNewHousingNeeds && <SimulationDemographicParcEvolution results={flowResults} horizon={simulation.scenario.projection} />}
          <SimulationBadHousing horizon={simulation.scenario.projection} results={stockResults} />
        </div>
      ),
      iconId: 'ri-road-map-line' as RiIconClassName,
      label: epci.name,
      tabId: epci.code,
    }
  })
  const bassinTab = {
    content: (
      <div className="fr-container-md fr-flex fr-direction-column fr-flex-gap-8v">
        <SimulationSettingsDropdown simulation={simulation} />
        <SimulationNeedsSummary projection={simulation.scenario.projection} results={results} epcis={simulation.epcis} />

        <SimulationDemographicBadHousingSummary
          simulationId={simulation.id}
          totalFlux={results.totalFlux}
          totalStock={results.totalStock}
        />

        {results.totalFlux > 0 && (
          <SimulationSecondaryVacantsAccommodationsSummary results={results} projection={simulation.scenario.projection} />
        )}
        <SimulationEpcisDetails simulation={simulation} />
      </div>
    ),
    iconId: 'ri-home-line' as RiIconClassName,
    label: 'Synthèse des besoins',
    tabId: 'bassin',
  }
  const tabs = [bassinTab, ...epciTabs]

  const segments = Object.values(groupedSimulations).map((simulation) => ({
    id: simulation.id,
    name: simulation.name,
  }))

  return (
    <>
      <div className="fr-container fr-direction-column fr-flex fr-flex-gap-8v">
        <SimulationHeaderTitle name={name} projection={simulation.scenario.projection} />
        <div className="fr-col-md-12 fr-flex fr-direction-column fr-direction-sm-row fr-align-items-center fr-mb-4w">
          <div className="fr-col-md-8 fr-mb-2w fr-mb-md-0">
            <SimulationHeaderSegmentedControls segments={segments} activeId={id} />
          </div>
          <div className="fr-col-md-4">
            <div className="fr-flex fr-flex-gap-4v fr-align-items-center">
              <Button
                priority="secondary"
                linkProps={{
                  href: `/simulation/parametrages-demographique?epciGroupId=${simulation.epciGroupId}&epcis=${simulation.epcis.map((epci) => epci.code).join(',')}&projection=${simulation.scenario.projection}`,
                }}
              >
                Élaborer un autre scénario
              </Button>
              <ExportExcelSimulationButton id={id} />
            </div>
          </div>
        </div>
      </div>
      <SimulationResultsTabs tabs={tabs} />
    </>
  )
}
