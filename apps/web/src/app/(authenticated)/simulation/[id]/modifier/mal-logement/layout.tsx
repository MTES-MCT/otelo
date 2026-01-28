import { fr } from '@codegouvfr/react-dsfr'
import { BadHousingSettingsFormContextWrapper } from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-form-context-wrapper'
import BadHousingSettingsSimulationSideMenu from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-simulation-side-menu'
import { BadHousingSettingsSimulationStepper } from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-simulation-stepper'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ModifySimulationLayout({ children, params }: SimulationLayoutProps) {
  const { id } = await params
  return (
    <div className={fr.cx('fr-grid-row')}>
      <BadHousingSettingsFormContextWrapper>
        <BadHousingSettingsSimulationSideMenu id={id} />

        <div className={fr.cx('fr-col-md-9')} style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}>
          <div className={fr.cx('fr-container')}>
            <BadHousingSettingsSimulationStepper />
            {children}
          </div>
        </div>
      </BadHousingSettingsFormContextWrapper>
    </div>
  )
}
