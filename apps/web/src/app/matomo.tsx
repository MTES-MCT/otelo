'use client'

import { push, trackAppRouter } from '@socialgouv/matomo-next'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { isTrackingEnabled } from '~/lib/tracking'

const SHARE_PATH_PREFIX = '/partage/'
const SHARE_ANONYMISED_PATH = '/partage/[token]'

/**
 * Le token d'un lien de partage est un secret : il ne doit jamais atterrir dans
 * les rapports Matomo, ni dans l'URL de page, ni dans le référent.
 */
export const anonymisePathname = (pathname: string): string => (pathname.startsWith(SHARE_PATH_PREFIX) ? SHARE_ANONYMISED_PATH : pathname)

export default function Matomo() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isTrackingEnabled()) {
      return
    }

    const trackedPathname = anonymisePathname(pathname)

    trackAppRouter({
      disableCookies: true,
      // Mesure du temps réellement passé sur la page (sinon Matomo compte 0s sur une visite d'une seule page).
      enableHeartBeatTimer: true,
      // La toute première vue de page n'appelle pas `setCustomUrl` et retombe sur `document.URL`,
      // qui contient le token en cas d'accès direct à un lien de partage.
      onInitialization: () => {
        if (trackedPathname !== pathname) {
          push(['setCustomUrl', trackedPathname])
          push(['setReferrerUrl', ''])
        }
      },
      pathname: trackedPathname,
      searchParams,
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID || '',
      url: process.env.NEXT_PUBLIC_MATOMO_URL || '',
    })
    // `trackAppRouter` est conçu pour être rappelé à chaque changement de route :
    // il conserve l'URL précédente en état interne et n'émet une vue que si l'URL a changé.
  }, [pathname, searchParams])

  return null
}
