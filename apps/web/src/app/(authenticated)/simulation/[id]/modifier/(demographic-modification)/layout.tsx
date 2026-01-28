import { fr } from '@codegouvfr/react-dsfr'
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

  return (
    <SimulationSettingsFormContextWrapper>
      <SimulationFormRatesProviderContextWrapper epcis={epcis}>
        <div className="fr-container">
          <div className="fr-flex fr-flex-gap-12v">
            <UpdateDemographicSettingsSimulationSideMenu id={id} />

            <div className={fr.cx('fr-col-md-9')} style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}>
              <div className={fr.cx('fr-container')}>
                <DemographicSettingsSimulationStepper />
                {children}
              </div>
            </div>
          </div>
        </div>
      </SimulationFormRatesProviderContextWrapper>
    </SimulationSettingsFormContextWrapper>
  )
}
