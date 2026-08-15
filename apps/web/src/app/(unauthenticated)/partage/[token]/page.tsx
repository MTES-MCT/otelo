import { RiIconClassName } from '@codegouvfr/react-dsfr/fr/generatedFromCss/classNames'
import { notFound } from 'next/navigation'
import { SharedViewTracker } from '~/components/collaboration/shared-view-tracker'
import { SimulationAnnualsNeedsSummary } from '~/components/simulations/results/annual-needs/simulation-annual-needs'
import { SimulationBadHousing } from '~/components/simulations/results/bad-housing/simulation-bad-housing'
import { SimulationDemographicBadHousingSummary } from '~/components/simulations/results/demographic-bad-housing/simulation-demographic-bad-housing-summary'
import { SimulationDemographicParcEvolution } from '~/components/simulations/results/demographic-parc-evolution/simulation-demographic-parc-evolution'
import { SimulationHeaderTitle } from '~/components/simulations/results/header/simulation-header-title'
import { SimulationSecondaryVacantsAccommodationsSummary } from '~/components/simulations/results/secondary-vacants-accommodation/simulation-secondary-vacants-accommodations-summary'
import { SimulationEpcisDetails } from '~/components/simulations/results/simulation-epcis-details'
import { SimulationResultsTabs } from '~/components/simulations/results/simulation-results-tabs'
import { SimulationNeedsSummary } from '~/components/simulations/results/summary/simulation-needs-summary'
import { TEpciCalculationResult, TEpciTotalCalculationResult, TFlowRequirementChartData, TSitadelData } from '~/schemas/results'
import { TGroupedSimulationWithResults } from '~/schemas/simulation'
import { calculateFlowResultsForEpci } from '~/utils/calculation-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const API_URL = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api` || 'http://localhost:4200/api'

async function getSharedResults(token: string): Promise<TGroupedSimulationWithResults> {
  const res = await fetch(`${API_URL}/share/${token}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  return res.json()
}

export default async function SharedResultsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { name, simulations: groupedSimulations } = await getSharedResults(token)

  const simulationIds = Object.keys(groupedSimulations)
  const simulation = groupedSimulations[simulationIds[0]]

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
        <div key={epci.code} className="fr-container fr-flex fr-direction-column fr-flex-gap-8v">
          <SimulationNeedsSummary projection={simulation.scenario.projection} results={epciResults} epci={epciData} />
          <SimulationDemographicBadHousingSummary
            simulationId={simulation.id}
            totalFlux={epciResults.totalFlux}
            totalStock={epciResults.totalStock}
            epci={epciData}
            readonly
          />
          {hasNewHousingNeeds && <SimulationSecondaryVacantsAccommodationsSummary results={epciResults} epci={epciData} />}
          <SimulationAnnualsNeedsSummary
            sitadelResults={sitadelResults}
            newConstructionsResults={epciFlowRequirementData}
            horizon={simulation.scenario.projection}
            hasSurplusHousing={hasSurplusHousing}
            epciName={epci.name}
          />
          {hasNewHousingNeeds && <SimulationDemographicParcEvolution results={flowResults} horizon={simulation.scenario.projection} />}
          <SimulationBadHousing
            simulationId={simulation.id}
            horizon={simulation.scenario.projection}
            millesime={simulation.scenario.millesime}
            results={stockResults}
          />
        </div>
      ),
      iconId: 'ri-road-map-line' as RiIconClassName,
      label: epci.name,
      tabId: epci.code,
    }
  })

  const bassinTab = {
    content: (
      <div key="territory" className="fr-container-md fr-flex fr-direction-column fr-flex-gap-8v">
        <SimulationNeedsSummary projection={simulation.scenario.projection} results={results} epcis={simulation.epcis} />

        <SimulationDemographicBadHousingSummary
          simulationId={simulation.id}
          totalFlux={results.totalFlux}
          totalStock={results.totalStock}
          readonly
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

  return (
    <>
      <SharedViewTracker />
      <div className="fr-container fr-direction-column fr-flex fr-flex-gap-8v fr-mb-4w">
        <SimulationHeaderTitle name={name} projection={simulation.scenario.projection} millesime={simulation.scenario.millesime} />
      </div>
      <SimulationResultsTabs tabs={tabs} />
    </>
  )
}
