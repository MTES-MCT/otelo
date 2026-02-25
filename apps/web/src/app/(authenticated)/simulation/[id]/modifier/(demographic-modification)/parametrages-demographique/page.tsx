import Alert from '@codegouvfr/react-dsfr/Alert'
import { redirect } from 'next/navigation'
import { DemographicSettingsFormWrapper } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/parametrages-demographique/demographic-settings-form-wrapper'
import { DataSourceLink } from '~/components/simulations/settings/data-source-link'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { getEpcisWithoutInseeProjection } from '~/server-only/demographic-evolution/get-epcis-without-insee-projection'
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
  const [omphaleEvolution, populationEvolution, epcisWithoutInseeProjection] = await Promise.all([
    getOmphaleDemographicEvolutionByEpci(epcisCodes,simulation.scenario.millesime),
    getPopulationDemographicEvolutionByEpci(epcisCodes, simulation.scenario.millesime),
    getEpcisWithoutInseeProjection(epcisCodes),
  ])
  const hasEpcisWithoutInseeProjection = epcisWithoutInseeProjection.length > 0

  return (
    <>
      {hasEpcisWithoutInseeProjection && (
        <div className="fr-py-2w fr-pt-2w">
          <Alert
            severity="warning"
            small
            description={
              <>
                Pour ce territoire, l'INSEE ne propose pas de projections démographiques robustes. Les projections affichées ont été
                recalculées en ventilant les projections départementales — ménages ou population — au prorata du poids de l'EPCI dans le
                département.{' '}
                <a href="/guide#elaboration-projections" target="_blank" rel="noopener noreferrer">
                  En savoir plus
                </a>
              </>
            }
          />
        </div>
      )}
      <div className="fr-flex fr-direction-column fr-background-default--grey shadow">
        <DemographicSettingsFormWrapper
          epcis={epcisCodes}
          omphaleEvolution={omphaleEvolution}
          populationEvolution={populationEvolution}
          scenarioId={simulation.scenario.id}
        />
      </div>
      <div className="fr-px-2w fr-pt-2w">
        <DataSourceLink anchor="#projections-demographiques" />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <NextStepLinkWithoutValidation href={href} />
      </div>
    </>
  )
}
