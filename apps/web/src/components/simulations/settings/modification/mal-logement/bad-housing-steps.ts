/**
 * Registre des étapes du sous-parcours « Affiner le mal-logement », sur le modèle de `wizard-steps.ts` :
 * le rang et le nombre d'étapes sont dérivés de l'ordre du tableau.
 */

export type BadHousingStepSlug =
  | 'horizon-de-resorption'
  | 'hors-logement'
  | 'heberges'
  | 'inadequation-financiere'
  | 'mauvaise-qualite'
  | 'suroccupation'
  | 'validation-parametrage'

export type BadHousingStep = {
  slug: BadHousingStepSlug
  /** Titre long, affiché en tête de la carte de l'étape. */
  title: string
  /** Libellé court, affiché sous la pastille du stepper. */
  stepperLabel: string
}

export const BAD_HOUSING_STEPS: readonly BadHousingStep[] = [
  { slug: 'horizon-de-resorption', title: "Déterminer l'horizon de résorption", stepperLabel: 'Horizon de résorption' },
  { slug: 'hors-logement', title: 'Paramétrage hors logement', stepperLabel: 'Hors logement' },
  { slug: 'heberges', title: 'Paramétrage hébergés', stepperLabel: 'Hébergés' },
  { slug: 'inadequation-financiere', title: 'Paramétrage inadéquation financière', stepperLabel: 'Inadéquation financière' },
  { slug: 'mauvaise-qualite', title: 'Paramétrage mauvaise qualité', stepperLabel: 'Mauvaise qualité' },
  { slug: 'suroccupation', title: 'Paramétrage suroccupation', stepperLabel: 'Suroccupation' },
  { slug: 'validation-parametrage', title: 'Validation de votre paramétrage', stepperLabel: 'Validation' },
]

/** Rang de l'étape d'après l'URL ; la racine du sous-parcours vaut la première étape. */
export const getBadHousingStepIndex = (pathname: string): number => {
  const segment = pathname.split('/').pop()
  const index = BAD_HOUSING_STEPS.findIndex((step) => step.slug === segment)
  return index === -1 ? 0 : index
}

export const buildBadHousingStepPath = (slug: BadHousingStepSlug, simulationId: string): string =>
  `/simulation/${simulationId}/modifier/mal-logement/${slug}`
