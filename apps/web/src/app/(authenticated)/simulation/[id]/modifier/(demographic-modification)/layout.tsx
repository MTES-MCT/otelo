import { AuthenticatedBreadcrumb } from '~/components/breadcrumbs/authenticated-breadcrumb'
import { DemographicPreview } from '~/components/simulations/preview/demographic-preview'
import { DemographicSettingsSimulationStepper } from '~/components/simulations/settings/demographic-settings-simulation-stepper'
import { SimulationSettingsFormContextWrapper } from '~/components/simulations/settings/modification/simulation-settings-form-context-wrapper'
import UpdateDemographicSettingsSimulationSideMenu from '~/components/simulations/settings/modification/update-demographic-settings-simulation-side-menu'
import { SimulationFormRatesProviderContextWrapper } from '~/components/simulations/settings/simulation-form-context-wrapper'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export default async function ModifySimulationLayout({ children, params }: SimulationLayoutProps) {
  const { id } = await params

  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]

  const epcis = simulation.scenario.epciScenarios.map((e) => e.epciCode)

  const peakYears = simulation.results?.flowRequirement?.epcis?.reduce(
    (acc, epci) => {
      acc[epci.code] = epci.data.peakYear
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="fr-container">
      <SimulationSettingsFormContextWrapper peakYears={peakYears}>
        <SimulationFormRatesProviderContextWrapper epcis={epcis}>
          <div className="fr-flex fr-flex-gap-12v">
            <nav className="fr-col-md-3">
              <AuthenticatedBreadcrumb />
              <UpdateDemographicSettingsSimulationSideMenu id={id} />
            </nav>

            <div className="fr-col-md-9">
              <main className="fr-container">
                <DemographicSettingsSimulationStepper />
                {children}
                <DemographicPreview />
              </main>
            </div>
          </div>
        </SimulationFormRatesProviderContextWrapper>
      </SimulationSettingsFormContextWrapper>
    </div>
  )
}
