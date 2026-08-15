'use client'

import { usePathname } from 'next/navigation'
import { type FC, useEffect } from 'react'
import { trackEvent } from '~/lib/tracking'
import { getFlowFromPathname, getSlugFromPathname } from './wizard-steps'

/**
 * S1 / M1 — progression dans le wizard.
 *
 * L'entonnoir est émis explicitement, étape par étape, et **jamais dérivé des URLs** :
 * tout l'état du wizard vit dans les paramètres d'URL via nuqs, et `NextStepLink` les
 * recopie d'une étape à la suivante. Les URLs grossissent donc en permanence et changent
 * sans changement d'étape — un entonnoir bâti dessus serait faux.
 *
 * Un parcours abandonné ne laisse aucune trace en base : c'est précisément ce que ces
 * événements permettent de voir.
 */
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
