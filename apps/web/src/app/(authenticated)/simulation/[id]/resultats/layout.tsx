import { SimulationsBreadcrumb } from '~/components/simulations/breadcrumbs/simulations-breadcrumb'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export default async function SimulationResultLayout({ children, params }: SimulationLayoutProps) {
  const { id } = await params
  const { simulations: groupedSimulations, name } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]
  return (
    <>
      <div className="fr-container">
        <SimulationsBreadcrumb groupName={name} simulation={simulation} />
      </div>
      {children}
    </>
  )
}
