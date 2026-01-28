import { redirect } from 'next/navigation'
import { DemographicSettingsFormWrapper } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/parametrages-demographique/demographic-settings-form-wrapper'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { getOmphaleDemographicEvolutionByEpci } from '~/server-only/demographic-evolution/get-omphale-evolution-by-epci'
import { getPopulationDemographicEvolutionByEpci } from '~/server-only/demographic-evolution/get-population-evolution-by-epci'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationPageParams } from '~/types/simulation-page-props'

type PageProps = {
  params: SimulationPageParams
  searchParams: Promise<{
    demographicEvolutionOmphaleCustomIds?: string | string[]
  }>
}

export default async function ParametragesDemographiquePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const awaitedSearchParams = await searchParams
  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]
  const epcisCodes = simulation.scenario.epciScenarios.map((e) => e.epciCode)

  // Check if demographicEvolutionOmphaleCustomIds is already in search params
  const hasCustomIdsParam = awaitedSearchParams.demographicEvolutionOmphaleCustomIds !== undefined

  // If not present and scenario has custom demographic evolution data, redirect with IDs
  if (
    !hasCustomIdsParam &&
    simulation.scenario.demographicEvolutionOmphaleCustom &&
    simulation.scenario.demographicEvolutionOmphaleCustom.length > 0
  ) {
    const customIds = simulation.scenario.demographicEvolutionOmphaleCustom.map((custom) => custom.id)

    // Preserve existing search params
    const searchParamsObj = new URLSearchParams()

    // Copy all existing search params
    Object.entries(awaitedSearchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParamsObj.append(key, v))
      } else if (value) {
        searchParamsObj.append(key, value)
      }
    })

    // Add the custom IDs
    searchParamsObj.append('demographicEvolutionOmphaleCustomIds', customIds.join(','))

    redirect(`/simulation/${id}/modifier/parametrages-demographique?${searchParamsObj.toString()}`)
  }

  const href = `/simulation/${id}/modifier/taux-cibles-logements-vacants`
  const omphaleEvolution = await getOmphaleDemographicEvolutionByEpci(epcisCodes)
  const populationEvolution = await getPopulationDemographicEvolutionByEpci(epcisCodes)

  return (
    <>
      <div className="fr-flex fr-direction-column fr-background-default--grey">
        <DemographicSettingsFormWrapper
          epcis={epcisCodes}
          omphaleEvolution={omphaleEvolution}
          populationEvolution={populationEvolution}
          scenarioId={simulation.scenario.id}
        />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <NextStepLinkWithoutValidation href={href} />
      </div>
    </>
  )
}
