import { ModifyEpcisSecondaryAccommodationRates } from '~/components/simulations/settings/epcis-accommodation-rates/modify-epcis-secondary-accomodation-rates'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationPageProps } from '~/types/simulation-page-props'

export default async function TargetSecondaryResidencesRates({ params }: SimulationPageProps) {
  const { id } = await params
  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]

  const href = `/simulation/${id}/modifier/taux-restructuration-disparition`

  return (
    <>
      <div className="fr-flex fr-direction-column fr-background-default--grey">
        <ModifyEpcisSecondaryAccommodationRates epcis={simulation.epcis} />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <NextStepLinkWithoutValidation href={href} />
      </div>
    </>
  )
}
