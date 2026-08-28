import { AuthenticatedBreadcrumb } from '~/components/breadcrumbs/authenticated-breadcrumb'
import { DemographicSettingsSimulationStepper } from '~/components/simulations/settings/demographic-settings-simulation-stepper'
import { SimulationSettingsFormContextWrapper } from '~/components/simulations/settings/modification/simulation-settings-form-context-wrapper'
import UpdateDemographicSettingsSimulationSideMenu from '~/components/simulations/settings/modification/update-demographic-settings-simulation-side-menu'
import { SimulationFormRatesProviderContextWrapper } from '~/components/simulations/settings/simulation-form-context-wrapper'
import { ModificationEstimationCard } from '~/components/simulations/settings/wizard-aside/modification-estimation-card'
import { WizardAside } from '~/components/simulations/settings/wizard-aside/wizard-aside'
import wizardLayout from '~/components/simulations/settings/wizard-aside/wizard-layout.module.css'
import { WizardStepTracker } from '~/components/simulations/settings/wizard-step-tracker'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export default async function ModifySimulationLayout({ children, params }: SimulationLayoutProps) {
  const { id } = await params

  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]

  const epcis = simulation.scenario.epciScenarios.map((e) => e.epciCode)

  // Le contexte de paramétrage ne porte que les taux : le libellé du territoire se calcule ici.
  const baseEpci = simulation.epcis.find((epci) => epci.baseEpci) ?? simulation.epcis[0]
  const otherEpcisCount = simulation.epcis.length - 1
  const territoryLabel = baseEpci ? `${baseEpci.name}${otherEpcisCount > 0 ? ` + ${otherEpcisCount} EPCI` : ''}` : null
  const epciOptions = simulation.epcis.map((epci) => ({ code: epci.code, name: epci.name }))

  const peakYears = simulation.results?.flowRequirement?.epcis?.reduce(
    (acc, epci) => {
      acc[epci.code] = epci.data.peakYear
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className={wizardLayout.container}>
      <WizardStepTracker />
      <SimulationSettingsFormContextWrapper peakYears={peakYears}>
        <SimulationFormRatesProviderContextWrapper epcis={epcis}>
          <div className="fr-flex fr-flex-wrap fr-flex-gap-6v">
            <nav className={wizardLayout.navColumn}>
              <AuthenticatedBreadcrumb />
              <UpdateDemographicSettingsSimulationSideMenu id={id} />
            </nav>

            <div className={wizardLayout.mainColumn}>
              <main>
                <DemographicSettingsSimulationStepper />
                {children}
              </main>
            </div>

            <WizardAside>
              <ModificationEstimationCard territoryLabel={territoryLabel} epciOptions={epciOptions} />
            </WizardAside>
          </div>
        </SimulationFormRatesProviderContextWrapper>
      </SimulationSettingsFormContextWrapper>
    </div>
  )
}
