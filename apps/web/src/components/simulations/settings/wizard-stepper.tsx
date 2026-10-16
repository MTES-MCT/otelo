'use client'

import { useSearchParams } from 'next/navigation'
import { FC } from 'react'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { Stepper } from '~/components/ui/stepper/stepper'
import { useWizardStep } from './use-wizard-step'
import { buildStepPath } from './wizard-steps'

export const WizardStepper: FC = () => {
  const searchParams = useSearchParams()
  const { currentIndex, flow, simulationId, steps } = useWizardStep()
  const query = searchParams.toString()

  // Revenir sur une étape complétée garde toute la saisie, portée par la query string.
  const stepperSteps = steps.map((step) => ({
    href: `${buildStepPath(step.slug, flow, simulationId)}${query ? `?${query}` : ''}`,
    label: step.stepperLabel,
  }))

  return (
    <div {...tutorialAnchor('wizard-stepper')}>
      <Stepper steps={stepperSteps} currentIndex={currentIndex} ariaLabel="Étapes du paramétrage du scénario" />
    </div>
  )
}
