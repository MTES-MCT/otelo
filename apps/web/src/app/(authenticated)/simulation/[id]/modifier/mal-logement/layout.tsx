import { BadHousingScenarioPanel } from '~/components/simulations/settings/modification/mal-logement/bad-housing-scenario-panel'
import { BadHousingSettingsFormContextWrapper } from '~/components/simulations/settings/modification/mal-logement/bad-housing-settings-form-context-wrapper'
import { BadHousingStepHeader } from '~/components/simulations/settings/modification/mal-logement/bad-housing-step-header'
import { BadHousingStepper } from '~/components/simulations/settings/modification/mal-logement/bad-housing-stepper'
import { WizardLayout } from '~/components/simulations/settings/wizard-layout'
import type { SimulationLayoutProps } from '~/types/simulation-page-props'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ModifyBadHousingLayout({ children }: SimulationLayoutProps) {
  return (
    <BadHousingSettingsFormContextWrapper>
      <WizardLayout stepper={<BadHousingStepper />} panel={<BadHousingScenarioPanel />} header={<BadHousingStepHeader />}>
        {children}
      </WizardLayout>
    </BadHousingSettingsFormContextWrapper>
  )
}
