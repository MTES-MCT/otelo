import { push, sendEvent } from '@socialgouv/matomo-next'

/**
 * Catalogue fermé des catégories d'événements Matomo.
 * Toute nouvelle catégorie doit être ajoutée ici ET documentée dans `TRACKING.md`.
 */
export type MatomoEventCategory =
  | 'Authentification'
  | 'Simulation'
  | 'Partage'
  | 'Infographie'
  | 'Export'
  | 'Aide'
  | 'Territoires voisins'
  | 'Navigation'
  | 'Engagement'

type TrackEventParams = {
  category: MatomoEventCategory
  /** Verbe d'action en minuscules, sans accent : `activation partage`, `etape wizard`... */
  action: string
  /** Identifiant contextuel : slug d'étape, code EPCI, `succes` / `erreur`... */
  name?: string
  /** Valeur numérique agrégeable : nombre d'EPCI, note de feedback... */
  value?: number
}

/**
 * Index des dimensions personnalisées, tels que configurés côté Matomo.
 * Aucune donnée identifiante ne doit y transiter : le mode exempté CNIL revendiqué
 * sur la page « Données personnelles » suppose un tracking non identifiant.
 */
export const MATOMO_DIMENSIONS = {
  isAuthenticated: 3,
  userRegion: 2,
  userType: 1,
} as const

/**
 * Coupe-circuit runtime. Utilisé pour les sessions d'usurpation (un administrateur
 * naviguant « en tant que » un utilisateur) : leur activité ne doit pas polluer les
 * statistiques d'usage réel.
 *
 * Limite connue : la session n'est chargée qu'après le premier rendu, donc la toute
 * première vue de page d'une session usurpée peut être comptée. Les événements, eux,
 * sont tous exclus. Le décompte exact des connexions se fait en base (`login_events`),
 * qui exclut les usurpations de façon fiable.
 */
let trackingDisabled = false

export const setTrackingDisabled = (disabled: boolean): void => {
  trackingDisabled = disabled
}

export const isTrackingEnabled = (): boolean => process.env.NODE_ENV === 'production' && !trackingDisabled

/** Envoie un événement personnalisé. No-op hors production et en session usurpée. */
export function trackEvent({ action, category, name, value }: TrackEventParams): void {
  if (!isTrackingEnabled()) {
    return
  }

  // `sendEvent` type `value` en string côté lib, Matomo attend un nombre à l'arrivée.
  if (name !== undefined && value !== undefined) {
    sendEvent({ action, category, name, value: String(value) })
  } else if (name !== undefined) {
    sendEvent({ action, category, name })
  } else {
    sendEvent({ action, category })
  }
}

/**
 * Alimente le rapport « Recherche interne » de Matomo, qui expose gratuitement
 * les recherches sans résultat — impossible à obtenir avec un simple événement.
 */
export function trackSiteSearch(keyword: string, category: string, resultsCount?: number): void {
  if (!isTrackingEnabled() || !keyword) {
    return
  }

  // Le nombre de résultats est optionnel côté Matomo : on omet l'argument plutôt que
  // d'envoyer 0, qui signifierait « recherche sans résultat ».
  const args: (string | number)[] = ['trackSiteSearch', keyword, category]

  if (resultsCount !== undefined) {
    args.push(resultsCount)
  }

  push(args)
}

/** Positionne une dimension personnalisée de portée « visite ». */
export function setCustomDimension(index: (typeof MATOMO_DIMENSIONS)[keyof typeof MATOMO_DIMENSIONS], value: string): void {
  if (!isTrackingEnabled() || !value) {
    return
  }

  push(['setCustomDimension', index, value])
}
