import { BadHousingSettingsFormContextWrapper } from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-form-context-wrapper'
import BadHousingSettingsSimulationSideMenu from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-simulation-side-menu'
import { BadHousingSettingsSimulationStepper } from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-simulation-stepper'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ModifySimulationLayout({ children, params }: SimulationLayoutProps) {
  const { id } = await params
  return (
    <div className="fr-container">
      <BadHousingSettingsFormContextWrapper>
        <div className="fr-flex fr-flex-gap-12v">
          <BadHousingSettingsSimulationSideMenu id={id} />
          <div className="fr-col-md-9">
            <div className="fr-container">
              <BadHousingSettingsSimulationStepper />
              {children}
            </div>
          </div>
        </div>
      </BadHousingSettingsFormContextWrapper>
    </div>
  )
}
