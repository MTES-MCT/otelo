/**
 * Registre unique des étapes du parcours de scénario démographique.
 *
 * Source de vérité pour le stepper, la colonne « Votre scénario », la navigation précédent/suivant
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
  /** Titre long, affiché en tête de la carte de l'étape. */
  title: string
  /** Libellé court, affiché sous la pastille du stepper. */
  stepperLabel: string
  /** Précision affichée sous le titre de l'étape. */
  description?: string
}

const CHOIX_DU_TERRITOIRE: WizardStep = {
  slug: 'choix-du-territoire',
  title: "Choix du territoire d'étude",
  stepperLabel: "Territoire d'étude",
}

const CADRAGE_TEMPOREL: WizardStep = {
  slug: 'cadrage-temporel',
  title: 'Horizon de temps',
  stepperLabel: 'Horizon de temps',
}

const PARAMETRAGES_DEMOGRAPHIQUE: WizardStep = {
  slug: 'parametrages-demographique',
  title: 'Évolution démographique',
  stepperLabel: 'Évolution démographique',
}

const TAUX_CIBLES_LOGEMENTS_VACANTS: WizardStep = {
  slug: 'taux-cibles-logements-vacants',
  title: 'Taux de vacance longue durée',
  stepperLabel: 'Vacance longue durée',
}

const TAUX_CIBLES_RESIDENCES_SECONDAIRES: WizardStep = {
  slug: 'taux-cibles-residences-secondaires',
  title: 'Taux de résidences secondaires',
  stepperLabel: 'Résidences secondaires',
}

const TAUX_RESTRUCTURATION_DISPARITION: WizardStep = {
  slug: 'taux-restructuration-disparition',
  title: 'Dynamiques de renouvellement urbain',
  stepperLabel: 'Renouvellement urbain',
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

/** Récapitulatif final de la modification : hors registre, il suit la dernière étape. */
export const isValidationPathname = (pathname: string): boolean => pathname.endsWith('/validation-parametrage')
