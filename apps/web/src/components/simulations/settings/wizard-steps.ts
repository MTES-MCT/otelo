/**
 * Registre unique des étapes du parcours de scénario démographique.
 *
 * Source de vérité pour le stepper, le menu latéral, la navigation précédent/suivant
 * et le mode tuto. Le rang et le nombre d'étapes sont dérivés de l'ordre du tableau :
 * ils ne sont jamais saisis à la main.
 */

export type WizardFlow = 'creation' | 'modification'

export type WizardStepSlug =
  | 'choix-du-territoire'
  | 'cadrage-temporel'
  | 'parametrages-demographique'
  | 'taux-cibles-logements-vacants'
  | 'taux-cibles-residences-secondaires'
  | 'taux-restructuration-disparition'

export type WizardStep = {
  slug: WizardStepSlug
  /** Titre long, affiché dans le stepper DSFR. */
  title: string
  /** Titre court, affiché dans le menu latéral. */
  shortTitle: string
  /** Précision affichée sous le stepper. */
  description?: string
  /** Paramètres d'URL portant la saisie de l'étape, lus par les tags du menu latéral. */
  queryKeys: string[]
  iconId?: string
}

const CHOIX_DU_TERRITOIRE: WizardStep = {
  slug: 'choix-du-territoire',
  title: 'Choix du territoire',
  shortTitle: 'Choix du territoire',
  queryKeys: ['epci', 'epcis'],
}

const CADRAGE_TEMPOREL: WizardStep = {
  slug: 'cadrage-temporel',
  title: "Déterminer l'horizon de temps",
  shortTitle: 'Horizon de temps',
  description: "Les futurs paramétrages seront appliqués à l'horizon temporel choisi",
  queryKeys: ['projection'],
  iconId: 'ri-time-line',
}

const PARAMETRAGES_DEMOGRAPHIQUE: WizardStep = {
  slug: 'parametrages-demographique',
  title: 'Affiner la projection démographique',
  shortTitle: 'Projection démographique',
  description: "Les choix de projection démographique s'appliquent à l'ensemble des EPCI inclus dans le territoire d'étude.",
  queryKeys: ['omphale'],
}

const TAUX_CIBLES_LOGEMENTS_VACANTS: WizardStep = {
  slug: 'taux-cibles-logements-vacants',
  title: 'Cibler le taux de logements vacants de longue durée',
  shortTitle: 'Logements vacants longue durée',
  queryKeys: [],
}

const TAUX_CIBLES_RESIDENCES_SECONDAIRES: WizardStep = {
  slug: 'taux-cibles-residences-secondaires',
  title: 'Cibler le taux de résidences secondaires',
  shortTitle: 'Résidences secondaires',
  queryKeys: [],
}

const TAUX_RESTRUCTURATION_DISPARITION: WizardStep = {
  slug: 'taux-restructuration-disparition',
  title: 'Paramétrer les dynamiques de renouvellement urbain',
  shortTitle: 'Renouvellement urbain',
  queryKeys: [],
}

export const CREATION_STEPS: readonly WizardStep[] = [
  CHOIX_DU_TERRITOIRE,
  CADRAGE_TEMPOREL,
  PARAMETRAGES_DEMOGRAPHIQUE,
  TAUX_CIBLES_LOGEMENTS_VACANTS,
  TAUX_CIBLES_RESIDENCES_SECONDAIRES,
  TAUX_RESTRUCTURATION_DISPARITION,
]

/** La modification reprend le parcours de création, sans le choix du territoire : il est déjà figé. */
export const MODIFICATION_STEPS: readonly WizardStep[] = CREATION_STEPS.filter((step) => step.slug !== 'choix-du-territoire')

export const getStepsForFlow = (flow: WizardFlow): readonly WizardStep[] => (flow === 'modification' ? MODIFICATION_STEPS : CREATION_STEPS)

export const getFlowFromPathname = (pathname: string): WizardFlow => (pathname.includes('/modifier') ? 'modification' : 'creation')

export const getSlugFromPathname = (pathname: string): WizardStepSlug | undefined => {
  const segment = pathname.split('/').pop()
  return CREATION_STEPS.some((step) => step.slug === segment) ? (segment as WizardStepSlug) : undefined
}

export const buildStepPath = (slug: WizardStepSlug, flow: WizardFlow, simulationId?: string): string =>
  flow === 'modification' && simulationId ? `/simulation/${simulationId}/modifier/${slug}` : `/simulation/${slug}`

export const getStepIndex = (slug: WizardStepSlug | undefined, flow: WizardFlow): number =>
  slug ? getStepsForFlow(flow).findIndex((step) => step.slug === slug) : -1
