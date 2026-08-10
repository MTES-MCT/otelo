import { AuthenticatedBreadcrumb } from '~/components/breadcrumbs/authenticated-breadcrumb'
import DemographicSettingsSimulationSideMenu from '~/components/simulations/settings/demographic-settings-simulation-side-menu'
import { DemographicSettingsSimulationStepper } from '~/components/simulations/settings/demographic-settings-simulation-stepper'
import { MillesimeInitializer } from '~/components/simulations/settings/millesime-initializer'
import { SimulationFormRatesProviderContextWrapper } from '~/components/simulations/settings/simulation-form-context-wrapper'
import { CreationEstimationCard } from '~/components/simulations/settings/wizard-aside/creation-estimation-card'
import { WizardAside } from '~/components/simulations/settings/wizard-aside/wizard-aside'
import wizardLayout from '~/components/simulations/settings/wizard-aside/wizard-layout.module.css'

type PageProps = {
  children: React.ReactNode
}

export default function CreateSimulationLayout({ children }: PageProps) {
  return (
    <div className={wizardLayout.container}>
      <SimulationFormRatesProviderContextWrapper>
        <div className="fr-flex fr-flex-wrap fr-flex-gap-6v">
          <nav className={wizardLayout.navColumn}>
            <AuthenticatedBreadcrumb />
            <DemographicSettingsSimulationSideMenu />
          </nav>

          <div className={wizardLayout.mainColumn}>
            <main>
              <MillesimeInitializer />
              <DemographicSettingsSimulationStepper />
              {children}
            </main>
          </div>

          <WizardAside>
            <CreationEstimationCard />
          </WizardAside>
        </div>
      </SimulationFormRatesProviderContextWrapper>
    </div>
  )
}
