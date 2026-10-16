'use client'

import { useParams, usePathname } from 'next/navigation'
import {
  getFlowFromPathname,
  getSlugFromPathname,
  getStepIndex,
  getStepsForFlow,
  isValidationPathname,
  type WizardFlow,
  type WizardStep,
  type WizardStepSlug,
} from './wizard-steps'

type WizardStepState = {
  flow: WizardFlow
  steps: readonly WizardStep[]
  /** Rang de l'étape en cours ; `steps.length` sur le récapitulatif final, `-1` hors du parcours. */
  currentIndex: number
  currentStep: WizardStep | undefined
  simulationId: string | undefined
  /** L'étape est en cours ou passée. Une étape absente du parcours (le territoire, en modification) est toujours acquise. */
  hasReached: (slug: WizardStepSlug) => boolean
}

/** Position dans le parcours démographique, dérivée de l'URL seule. */
export const useWizardStep = (): WizardStepState => {
  const pathname = usePathname()
  const params = useParams()
  const flow = getFlowFromPathname(pathname)
  const steps = getStepsForFlow(flow)
  const currentIndex = isValidationPathname(pathname) ? steps.length : getStepIndex(getSlugFromPathname(pathname), flow)

  const hasReached = (slug: WizardStepSlug) => {
    const index = getStepIndex(slug, flow)
    return currentIndex >= 0 && index <= currentIndex
  }

  return {
    currentIndex,
    currentStep: steps[currentIndex],
    flow,
    hasReached,
    simulationId: flow === 'modification' && params.id ? String(params.id) : undefined,
    steps,
  }
}
