import { AuthenticatedBreadcrumb } from '~/components/breadcrumbs/authenticated-breadcrumb'
import { CreationPreview } from '~/components/simulations/preview/creation-preview'
import DemographicSettingsSimulationSideMenu from '~/components/simulations/settings/demographic-settings-simulation-side-menu'
import { DemographicSettingsSimulationStepper } from '~/components/simulations/settings/demographic-settings-simulation-stepper'
import { SelectMillesimeModal } from '~/components/simulations/settings/select-millesime-modal'
import { SimulationFormRatesProviderContextWrapper } from '~/components/simulations/settings/simulation-form-context-wrapper'

type PageProps = {
  children: React.ReactNode
}

export default function CreateSimulationLayout({ children }: PageProps) {
  return (
    <div className="fr-container">
      <SimulationFormRatesProviderContextWrapper>
        <div className="fr-flex fr-flex-gap-12v">
          <nav className="fr-col-md-3">
            <AuthenticatedBreadcrumb />
            <DemographicSettingsSimulationSideMenu />
          </nav>

          <div className="fr-col-md-9">
            <main className="fr-container">
              <SelectMillesimeModal />
              <DemographicSettingsSimulationStepper />
              {children}
              <CreationPreview />
            </main>
          </div>
        </div>
      </SimulationFormRatesProviderContextWrapper>
    </div>
  )
}
