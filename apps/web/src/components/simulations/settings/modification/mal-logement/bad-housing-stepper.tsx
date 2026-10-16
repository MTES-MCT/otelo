'use client'

import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { FC } from 'react'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { Stepper } from '~/components/ui/stepper/stepper'
import { BAD_HOUSING_STEPS, buildBadHousingStepPath, getBadHousingStepIndex } from './bad-housing-steps'

export const BadHousingStepper: FC = () => {
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const simulationId = String(params.id)

  const steps = BAD_HOUSING_STEPS.map((step) => ({
    href: `${buildBadHousingStepPath(step.slug, simulationId)}${query ? `?${query}` : ''}`,
    label: step.stepperLabel,
  }))

  return (
    <div {...tutorialAnchor('bad-housing-stepper')}>
      <Stepper steps={steps} currentIndex={getBadHousingStepIndex(pathname)} ariaLabel="Étapes du paramétrage du mal-logement" />
    </div>
  )
}
