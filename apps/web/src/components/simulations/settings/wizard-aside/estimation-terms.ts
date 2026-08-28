import { EstimationBreakdown, EstimationTermKey } from '@shared'
import { getStepIndex, WizardFlow, WizardStepSlug } from '~/components/simulations/settings/wizard-steps'

/**
 * Registre de lecture de la carte d'estimation : quel terme appartient à quel bloc, à partir de
 * quelle étape il a un sens, et s'il mérite d'être affiché quand il vaut zéro.
 *
 * Le rattachement passe par le *slug* et jamais par un index en dur : le parcours de modification
 * n'a pas l'étape « choix du territoire » et décale tous les rangs (`wizard-steps.ts`).
 */

export type EstimationSectionKey = 'principalResidences' | 'parcEvolution' | 'mobilisable'

export type EstimationSection = {
  key: EstimationSectionKey
  title: string
  terms: EstimationTermKey[]
}

type EstimationTerm = {
  label: string
  /** Étape à partir de laquelle le terme est révélé, et pendant laquelle il est signalé « en cours ». */
  step: WizardStepSlug
  /** Un terme `positive-only` reste masqué tant qu'il vaut zéro : son sens dépend du signe. */
  display: 'always' | 'positive-only'
  /** Renvoie vers la note de bas de carte. */
  footnote?: boolean
}

export const ESTIMATION_TERMS: Record<EstimationTermKey, EstimationTerm> = {
  demographic: { label: 'Évolution du nombre de ménages', step: 'parametrages-demographique', display: 'always' },
  badHousing: {
    label: 'Situations de mal-logement générant un besoin en logements supplémentaires',
    step: 'parametrages-demographique',
    display: 'always',
    footnote: true,
  },
  fluidity: { label: 'Maintien de la fluidité du parc', step: 'taux-cibles-logements-vacants', display: 'always' },
  vacancyIncrease: {
    label: 'Augmentation des logements vacants de longue durée',
    step: 'taux-cibles-logements-vacants',
    display: 'positive-only',
  },
  secondaryIncrease: {
    label: 'Augmentation des résidences secondaires',
    step: 'taux-cibles-residences-secondaires',
    display: 'positive-only',
  },
  disappearanceSurplus: {
    label: 'Disparition de logements excédant les apparitions de logements',
    step: 'taux-restructuration-disparition',
    display: 'positive-only',
  },
  vacancyRemobilised: {
    label: 'Remobilisation de logements vacants de longue durée',
    step: 'taux-cibles-logements-vacants',
    display: 'positive-only',
  },
  fluidityReleased: {
    label: 'Libération de logements vacants de courte durée',
    step: 'taux-cibles-logements-vacants',
    display: 'positive-only',
  },
  secondaryDecrease: {
    label: 'Diminution du nombre de résidences secondaires',
    step: 'taux-cibles-residences-secondaires',
    display: 'positive-only',
  },
  appearanceSurplus: {
    label: 'Apparition de logements excédant les disparitions de logements',
    step: 'taux-restructuration-disparition',
    display: 'positive-only',
  },
}

export const ESTIMATION_SECTIONS: EstimationSection[] = [
  {
    key: 'principalResidences',
    title: 'Besoin en résidences principales supplémentaires',
    terms: ['demographic', 'badHousing'],
  },
  {
    key: 'parcEvolution',
    title: 'Besoin lié à l’évolution du parc de logements',
    terms: ['fluidity', 'vacancyIncrease', 'secondaryIncrease', 'disappearanceSurplus'],
  },
  {
    key: 'mobilisable',
    title: 'Logements mobilisables au sein du parc existant',
    terms: ['vacancyRemobilised', 'fluidityReleased', 'secondaryDecrease', 'appearanceSurplus'],
  },
]

const ADDITIONAL_NEED_TERMS = [...ESTIMATION_SECTIONS[0].terms, ...ESTIMATION_SECTIONS[1].terms]
const OPTIMISATION_TERMS = ESTIMATION_SECTIONS[2].terms

/**
 * Un terme apparaît **dès** son étape, et non à la fin : c'est ce qui permet de le signaler « en cours
 * de paramétrage » pendant qu'on le règle, et c'est la seule façon de voir F et I, dont l'étape est la
 * dernière du parcours.
 */
export const isTermRevealed = (key: EstimationTermKey, currentSlug: WizardStepSlug | undefined, flow: WizardFlow): boolean => {
  const currentIndex = getStepIndex(currentSlug, flow)
  const termIndex = getStepIndex(ESTIMATION_TERMS[key].step, flow)
  return currentIndex >= 0 && termIndex >= 0 && termIndex <= currentIndex
}

export const isTermBeingEdited = (key: EstimationTermKey, currentSlug: WizardStepSlug | undefined): boolean =>
  ESTIMATION_TERMS[key].step === currentSlug

export const isTermVisible = (
  key: EstimationTermKey,
  breakdown: EstimationBreakdown,
  currentSlug: WizardStepSlug | undefined,
  flow: WizardFlow,
): boolean => {
  if (!isTermRevealed(key, currentSlug, flow)) return false
  return ESTIMATION_TERMS[key].display === 'always' || Math.round(breakdown.values[key]) > 0
}

/** Somme des seuls termes révélés : la carte doit toujours s'additionner à l'écran. */
const sumRevealed = (
  keys: EstimationTermKey[],
  breakdown: EstimationBreakdown,
  currentSlug: WizardStepSlug | undefined,
  flow: WizardFlow,
): number => keys.filter((key) => isTermRevealed(key, currentSlug, flow)).reduce((sum, key) => sum + breakdown.values[key], 0)

export type EstimationTotals = {
  /** I) — besoin en logements supplémentaires */
  additionalNeed: number
  /** II) — optimisation du parc existant */
  existingParcOptimisation: number
  /** I) − II) — constructions neuves */
  newConstructions: number
}

export const buildEstimationTotals = (
  breakdown: EstimationBreakdown,
  currentSlug: WizardStepSlug | undefined,
  flow: WizardFlow,
): EstimationTotals => {
  const additionalNeed = sumRevealed(ADDITIONAL_NEED_TERMS, breakdown, currentSlug, flow)
  const existingParcOptimisation = sumRevealed(OPTIMISATION_TERMS, breakdown, currentSlug, flow)
  return { additionalNeed, existingParcOptimisation, newConstructions: additionalNeed - existingParcOptimisation }
}

/**
 * Volume du bloc, ou `null` tant qu'aucun de ses termes n'est révélé : l'intitulé est là dès le
 * début, le chiffre n'arrive qu'avec la première contribution. Un bloc révélé mais nul reste chiffré
 * — c'est notamment le cas du parc mobilisable, dont le zéro est une information.
 */
export const getSectionTotal = (
  section: EstimationSection,
  breakdown: EstimationBreakdown,
  currentSlug: WizardStepSlug | undefined,
  flow: WizardFlow,
): number | null => {
  const revealed = section.terms.filter((key) => isTermRevealed(key, currentSlug, flow))
  if (revealed.length === 0) return null
  return revealed.reduce((sum, key) => sum + breakdown.values[key], 0)
}
