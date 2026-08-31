'use client'

import { type FC, useEffect } from 'react'
import { MATOMO_DIMENSIONS, setCustomDimension, setTrackingDisabled } from '~/lib/tracking'

type TrackingSessionProps = {
  isImpersonating: boolean
  userRegion?: string | null
  userType?: string | null
}

/**
 * Alimente Matomo avec le contexte de la session, sans jamais transmettre de donnée
 * identifiante (ni email, ni identifiant utilisateur) : le mode exempté CNIL revendiqué
 * sur la page « Données personnelles » suppose un tracking non identifiant.
 *
 * Les dimensions sont de portée « visite » : Matomo les applique rétroactivement à
 * l'ensemble de la visite, y compris à la vue de page déjà émise par `<Matomo />`.
 *
 * La dimension `is_authenticated` n'est positionnée qu'ici : son absence signifie
 * « visiteur non connecté » (les pages publiques ne montent pas ce composant).
 *
 * Ce composant ne rend rien et ne déclenche aucune requête : la session lui est
 * transmise par le layout authentifié, qui la connaît déjà côté serveur.
 */
export const TrackingSession: FC<TrackingSessionProps> = ({ isImpersonating, userRegion, userType }) => {
  useEffect(() => {
    setTrackingDisabled(isImpersonating)

    return () => setTrackingDisabled(false)
  }, [isImpersonating])

  useEffect(() => {
    if (isImpersonating) {
      return
    }

    setCustomDimension(MATOMO_DIMENSIONS.isAuthenticated, 'oui')

    if (userType) {
      setCustomDimension(MATOMO_DIMENSIONS.userType, userType)
    }

    if (userRegion) {
      setCustomDimension(MATOMO_DIMENSIONS.userRegion, userRegion)
    }
  }, [isImpersonating, userRegion, userType])

  return null
}
