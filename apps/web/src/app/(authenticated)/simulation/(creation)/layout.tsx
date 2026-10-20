import { MillesimeInitializer } from '~/components/simulations/settings/millesime-initializer'
import { CreationScenarioPanel } from '~/components/simulations/settings/scenario-panel/creation-scenario-panel'
import { SimulationFormRatesProviderContextWrapper } from '~/components/simulations/settings/simulation-form-context-wrapper'
import { WizardLayout } from '~/components/simulations/settings/wizard-layout'
import { WizardStepHeader } from '~/components/simulations/settings/wizard-step-header'
import { WizardStepTracker } from '~/components/simulations/settings/wizard-step-tracker'
import { WizardStepper } from '~/components/simulations/settings/wizard-stepper'

type PageProps = {
  children: React.ReactNode
}

export default function CreateSimulationLayout({ children }: PageProps) {
  return (
    <SimulationFormRatesProviderContextWrapper>
      <WizardStepTracker />
      <MillesimeInitializer />
      <WizardLayout stepper={<WizardStepper />} panel={<CreationScenarioPanel />} header={<WizardStepHeader />}>
        {children}
      </WizardLayout>
    </SimulationFormRatesProviderContextWrapper>
  )
}
