import { SimulationSettingsFormContextWrapper } from '~/components/simulations/settings/modification/simulation-settings-form-context-wrapper'
import { ModificationScenarioPanel } from '~/components/simulations/settings/scenario-panel/modification-scenario-panel'
import { SimulationFormRatesProviderContextWrapper } from '~/components/simulations/settings/simulation-form-context-wrapper'
import { WizardLayout } from '~/components/simulations/settings/wizard-layout'
import { WizardStepHeader } from '~/components/simulations/settings/wizard-step-header'
import { WizardStepTracker } from '~/components/simulations/settings/wizard-step-tracker'
import { WizardStepper } from '~/components/simulations/settings/wizard-stepper'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export default async function ModifySimulationLayout({ children, params }: SimulationLayoutProps) {
  const { id } = await params

  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]

  const epcis = simulation.scenario.epciScenarios.map((e) => e.epciCode)

  // Le contexte de paramétrage ne porte que les taux : les noms des EPCI viennent d'ici. L'EPCI de
  // référence ouvre la liste, comme dans le libellé du territoire.
  const epciOptions = [...simulation.epcis]
    .sort((a, b) => Number(Boolean(b.baseEpci)) - Number(Boolean(a.baseEpci)))
    .map((epci) => ({ code: epci.code, name: epci.name }))

  const peakYears = simulation.results?.flowRequirement?.epcis?.reduce(
    (acc, epci) => {
      acc[epci.code] = epci.data.peakYear
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <SimulationSettingsFormContextWrapper peakYears={peakYears}>
      <SimulationFormRatesProviderContextWrapper epcis={epcis}>
        <WizardStepTracker />
        <WizardLayout
          stepper={<WizardStepper />}
          panel={<ModificationScenarioPanel epciOptions={epciOptions} />}
          header={<WizardStepHeader />}
        >
          {children}
        </WizardLayout>
      </SimulationFormRatesProviderContextWrapper>
    </SimulationSettingsFormContextWrapper>
  )
}
