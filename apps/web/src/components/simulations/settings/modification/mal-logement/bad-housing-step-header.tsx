'use client'

import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { BadHousingTutorialButton } from '~/components/simulations/tutorial/bad-housing-tutorial-button'
import { StepHeader } from '../../step-header'
import { BAD_HOUSING_STEPS, getBadHousingStepIndex } from './bad-housing-steps'

export const BadHousingStepHeader: FC = () => {
  const index = getBadHousingStepIndex(usePathname())

  return (
    <StepHeader
      position={{ current: index + 1, total: BAD_HOUSING_STEPS.length }}
      title={BAD_HOUSING_STEPS[index].title}
      action={<BadHousingTutorialButton />}
    />
  )
}
