'use client'

import { type FC, useEffect, useRef } from 'react'
import { trackEvent } from '~/lib/tracking'

/**
 * P3 — consultation d'un lien de partage.
 *
 * Le compteur fiable vit en base (`SimulationShareLink.viewCount`, incrémenté côté API) ;
 * cet événement sert uniquement à connaître la provenance des visiteurs, information que
 * la base ne peut pas fournir.
 *
 * Ne transmet jamais le token : seul le domaine du référent est envoyé, et le chemin est
 * anonymisé en amont par le composant Matomo.
 */
export const SharedViewTracker: FC = () => {
  const hasTracked = useRef(false)

  useEffect(() => {
    // Garde contre le double montage du mode strict de React.
    if (hasTracked.current) {
      return
    }

    hasTracked.current = true

    let referrerHost = 'direct'

    if (document.referrer) {
      try {
        referrerHost = new URL(document.referrer).hostname
      } catch {
        referrerHost = 'inconnu'
      }
    }

    trackEvent({ action: 'consultation lien partage', category: 'Partage', name: referrerHost })
  }, [])

  return null
}
