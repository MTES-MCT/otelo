'use client'

import { usePathname } from 'next/navigation'
import { type FC, useEffect } from 'react'
import { trackEvent } from '~/lib/tracking'
import { getFlowFromPathname, getSlugFromPathname } from './wizard-steps'

export const WizardStepTracker: FC = () => {
  const pathname = usePathname()

  useEffect(() => {
    const slug = getSlugFromPathname(pathname)

    if (!slug) {
      return
    }

    const flow = getFlowFromPathname(pathname)

    trackEvent({
      action: flow === 'modification' ? 'etape modification demographique' : 'etape wizard',
      category: 'Simulation',
      name: slug,
    })
  }, [pathname])

  return null
}
