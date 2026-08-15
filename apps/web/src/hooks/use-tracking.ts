'use client'

import { useCallback } from 'react'
import { trackEvent as track, trackSiteSearch as trackSearch } from '~/lib/tracking'

/**
 * Accès mémoïsé aux helpers de tracking, pour pouvoir les passer sans risque
 * dans des tableaux de dépendances de `useEffect` / `useCallback`.
 */
export const useTracking = () => {
  const trackEvent = useCallback<typeof track>((params) => track(params), [])
  const trackSiteSearch = useCallback<typeof trackSearch>(
    (keyword, category, resultsCount) => trackSearch(keyword, category, resultsCount),
    [],
  )

  return { trackEvent, trackSiteSearch }
}
