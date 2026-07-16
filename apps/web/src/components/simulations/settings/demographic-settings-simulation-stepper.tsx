'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Stepper from '@codegouvfr/react-dsfr/Stepper'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { FC, useMemo } from 'react'
import { getFlowFromPathname, getSlugFromPathname, getStepsForFlow } from './wizard-steps'

export const DemographicSettingsSimulationStepper: FC = () => {
  const pathname = usePathname()
  const isRatesPath = pathname.includes('taux')

  const { currentStep, stepCount, title, description } = useMemo(() => {
    const steps = getStepsForFlow(getFlowFromPathname(pathname))
    const index = steps.findIndex((step) => step.slug === getSlugFromPathname(pathname))
    const step = steps[index] ?? steps[0]

    return {
      currentStep: (index === -1 ? 0 : index) + 1,
      stepCount: steps.length,
      title: step.title,
      description: step.description,
    }
  }, [pathname])

  return (
    <div
      className={classNames('fr-px-2w fr-py-0-5v fr-px-md-4w fr-pt-md-4w shadow', !isRatesPath && 'fr-pb-5w')}
      style={{ background: fr.colors.decisions.background.default.grey.default }}
    >
      <Stepper currentStep={currentStep} stepCount={stepCount} title={title} />
      {description && <div className="fr-text--sm fr-text-mention--grey fr-mb-0">{description}</div>}
    </div>
  )
}
