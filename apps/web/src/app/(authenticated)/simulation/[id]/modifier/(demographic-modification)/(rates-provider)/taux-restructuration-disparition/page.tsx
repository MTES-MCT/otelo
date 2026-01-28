import { ModifyRestructurationDisparitionRates } from '~/components/simulations/settings/restructuration-disparition-rates/modify-restructuration-disparition-rates'
import { UpdateSimulationForm } from '~/components/simulations/settings/update-simulation-form'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationPageProps } from '~/types/simulation-page-props'

export default async function RestructurationDisparitionRatesPage({ params }: SimulationPageProps) {
  const { id } = await params
  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]
  return (
    <>
      <div className="fr-flex fr-direction-column fr-background-default--grey">
        <ModifyRestructurationDisparitionRates epcis={simulation.epcis} />
      </div>
      <UpdateSimulationForm id={id} />
    </>
  )
}
