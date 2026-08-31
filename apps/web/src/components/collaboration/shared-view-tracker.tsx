'use client'

import { type FC, useEffect, useRef } from 'react'
import { trackEvent } from '~/lib/tracking'

export const SharedViewTracker: FC = () => {
  const hasTracked = useRef(false)

  useEffect(() => {
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
