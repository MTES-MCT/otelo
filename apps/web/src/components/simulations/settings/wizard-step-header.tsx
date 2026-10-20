'use client'

import { FC } from 'react'
import { TutorialButton } from '~/components/simulations/tutorial/tutorial-button'
import { StepHeader } from './step-header'
import { useWizardStep } from './use-wizard-step'

export const WizardStepHeader: FC = () => {
  const { currentIndex, currentStep, steps } = useWizardStep()

  if (currentIndex === -1) {
    return null
  }

  return (
    <StepHeader
      position={currentStep ? { current: currentIndex + 1, total: steps.length } : undefined}
      title={currentStep?.title ?? 'Validation de votre paramétrage'}
      description={currentStep?.description}
      action={<TutorialButton />}
    />
  )
}
