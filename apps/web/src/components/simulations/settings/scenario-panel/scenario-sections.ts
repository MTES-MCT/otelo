import { EstimationBreakdown, EstimationTermKey } from '@otelo/shared'
import { getStepIndex, getStepsForFlow, WizardFlow, WizardStepSlug } from '~/components/simulations/settings/wizard-steps'

/**
 * Registre de lecture de la colonne « Votre scénario » : comment les termes de l'estimation se
 * regroupent en lignes, à partir de quelle étape chaque ligne a un sens, et comment les blocs se
 * totalisent.
 *
 * Quatre blocs, qui suivent le calcul `(A+B+C+D+E+F) − (G+H+I+J)` de `buildEstimationBreakdown` :
 * - « Ménages à loger » (A+B) : le besoin démographique et le mal-logement ;
 * - « Évolution de l'offre du parc » (C+D+E+F) : ce que le parc consomme (vacance, résidences
 *   secondaires, disparitions) ;
 * - « Logements mobilisables dans le parc existant » (G+H+I+J) : ce que le parc libère ;
 * - « Besoin en logements supplémentaires » (I = A…F), réparti entre l'optimisation du parc
 *   existant (II = G…J) et, pour le reste, la construction neuve (I − II).
 *
 * Le rattachement passe par le *slug* et jamais par un index en dur : le parcours de modification
 * n'a pas l'étape « choix du territoire » et décale tous les rangs (`wizard-steps.ts`).
 */

export type ScenarioSectionKey = 'households' | 'parcOffer' | 'mobilisable' | 'housingToFind'

type ScenarioRowDefinition = {
  key: string
  label: string
  /** Termes sommés dans la ligne ; chacun n'est compté qu'une fois son étape atteinte. */
  terms: EstimationTermKey[]
  /** Étape à partir de laquelle la ligne est chiffrée, et pendant laquelle elle est signalée « en cours ». */
  step: WizardStepSlug
  /** Renvoie vers la note de bas de colonne. */
  footnote?: boolean
  /** Hypothèse rappelée sous le libellé : scénario démographique, ou taux cible quand un seul EPCI est affiché. */
  detail?: ScenarioRowDetail
  /** Une fois chiffrée, la ligne n'est affichée que si elle compte au moins un logement. */
  onlyIfPositive?: boolean
}

export type ScenarioRowDetail = 'demographicScenario' | 'longTermVacancyRate' | 'secondaryResidenceRate'

const HOUSEHOLDS_ROWS: ScenarioRowDefinition[] = [
  {
    key: 'demographic',
    label: 'Évolution du nombre de ménages',
    step: 'parametrages-demographique',
    terms: ['demographic'],
    detail: 'demographicScenario',
  },
  { key: 'badHousing', label: 'Situations de mal-logement', step: 'parametrages-demographique', terms: ['badHousing'], footnote: true },
]

const PARC_OFFER_ROWS: ScenarioRowDefinition[] = [
  // C — la vacance courte durée (fluidité du parc) a sa propre ligne : la fondre dans la vacance
  // longue durée laissait croire que celle-ci créait un besoin alors même que le scénario la remobilise.
  { key: 'shortTermVacancy', label: 'Vacance courte durée', step: 'taux-cibles-logements-vacants', terms: ['fluidity'] },
  // D
  {
    key: 'longTermVacancy',
    label: 'Vacance longue durée',
    step: 'taux-cibles-logements-vacants',
    terms: ['vacancyIncrease'],
    detail: 'longTermVacancyRate',
  },
  // E
  {
    key: 'secondaryResidences',
    label: 'Résidences secondaires',
    step: 'taux-cibles-residences-secondaires',
    terms: ['secondaryIncrease'],
    detail: 'secondaryResidenceRate',
    onlyIfPositive: true,
  },
  // F
  {
    key: 'disappearance',
    label: 'Renouvellement urbain',
    step: 'taux-restructuration-disparition',
    terms: ['disappearanceSurplus'],
    onlyIfPositive: true,
  },
]

const MOBILISABLE_ROWS: ScenarioRowDefinition[] = [
  // G
  {
    key: 'longTermVacancyRemobilised',
    label: 'Vacance longue durée remobilisée',
    step: 'taux-cibles-logements-vacants',
    terms: ['vacancyRemobilised'],
    onlyIfPositive: true,
  },
  // J — pendant de la ligne « Vacance courte durée » de l'offre : la fluidité que le parc libère.
  {
    key: 'shortTermVacancyReleased',
    label: 'Vacance courte durée libérée',
    step: 'taux-cibles-logements-vacants',
    terms: ['fluidityReleased'],
    onlyIfPositive: true,
  },
  // H
  {
    key: 'secondaryResidencesDecrease',
    label: 'Baisse des résidences secondaires',
    step: 'taux-cibles-residences-secondaires',
    terms: ['secondaryDecrease'],
    onlyIfPositive: true,
  },
  // I
  {
    key: 'appearance',
    label: 'Renouvellement urbain',
    step: 'taux-restructuration-disparition',
    terms: ['appearanceSurplus'],
    onlyIfPositive: true,
  },
]

/** Le récapitulatif se chiffre dès que le besoin démographique est connu. */
const SUMMARY_STEP: WizardStepSlug = 'parametrages-demographique'
/** Première étape qui chiffre un logement mobilisable dans le parc existant. */
const OPTIMISATION_STEP: WizardStepSlug = 'taux-cibles-logements-vacants'

export type ScenarioRow = {
  key: string
  label: string
  /** `null` tant que l'étape de la ligne n'est pas atteinte. */
  value: number | null
  /** Libellé court de l'étape qui chiffrera la ligne, pour l'infobulle des lignes à venir. */
  stepLabel: string
  isEditing: boolean
  footnote: boolean
  detail?: ScenarioRowDetail
}

export type ScenarioSection = {
  key: ScenarioSectionKey
  title: string
  /** `null` tant qu'aucune ligne du bloc n'est chiffrée. */
  total: number | null
  /** Lignes à afficher : celles qui ne valent rien sur ce scénario en sont retirées. */
  rows: ScenarioRow[]
  /** Le bloc contient la ligne en cours de paramétrage. */
  isEditing: boolean
  /** Message affiché quand le bloc est chiffré mais qu'aucune de ses lignes n'est à afficher. */
  emptyMessage?: string
}

const isStepReached = (
  step: WizardStepSlug,
  currentSlug: WizardStepSlug | undefined,
  flow: WizardFlow,
  isPastLastStep: boolean,
): boolean => {
  if (isPastLastStep) return true
  const currentIndex = getStepIndex(currentSlug, flow)
  const stepIndex = getStepIndex(step, flow)
  return currentIndex >= 0 && stepIndex >= 0 && stepIndex <= currentIndex
}

type ScenarioContext = {
  currentSlug: WizardStepSlug | undefined
  flow: WizardFlow
  /** Récapitulatif final : toutes les étapes sont atteintes. */
  isPastLastStep?: boolean
}

const getStepLabel = (step: WizardStepSlug, flow: WizardFlow): string =>
  getStepsForFlow(flow).find((candidate) => candidate.slug === step)?.stepperLabel ?? ''

const buildRow = (
  definition: Omit<ScenarioRowDefinition, 'terms'>,
  value: number | null,
  { currentSlug, flow }: ScenarioContext,
): ScenarioRow => ({
  footnote: Boolean(definition.footnote),
  isEditing: definition.step === currentSlug,
  key: definition.key,
  label: definition.label,
  detail: definition.detail,
  stepLabel: getStepLabel(definition.step, flow),
  value,
})

const sumTerms = (breakdown: EstimationBreakdown, terms: EstimationTermKey[]): number =>
  terms.reduce((sum, key) => sum + breakdown.values[key], 0)

const buildTermRow = (definition: ScenarioRowDefinition, breakdown: EstimationBreakdown, context: ScenarioContext): ScenarioRow => {
  const reached = isStepReached(definition.step, context.currentSlug, context.flow, Boolean(context.isPastLastStep))
  return buildRow(definition, reached ? sumTerms(breakdown, definition.terms) : null, context)
}

/** Somme des seules lignes chiffrées, ou `null` si aucune ne l'est : un bloc doit s'additionner à l'écran. */
const sumRows = (rows: ScenarioRow[]): number | null =>
  rows.some((row) => row.value !== null) ? rows.reduce((sum, row) => sum + (row.value ?? 0), 0) : null

/**
 * Une ligne « si > 0 » reste visible tant qu'elle n'est pas chiffrée, pour annoncer l'étape qui la
 * chiffrera ; une fois chiffrée, elle disparaît si elle ne compte aucun logement à l'arrondi.
 */
const isRowDisplayed = (definition: ScenarioRowDefinition, row: ScenarioRow): boolean =>
  !definition.onlyIfPositive || row.value === null || Math.round(row.value) > 0

const buildSection = (
  key: ScenarioSectionKey,
  title: string,
  rows: ScenarioRow[],
  options: { total?: number | null; emptyMessage?: string } = {},
): ScenarioSection => ({
  isEditing: rows.some((row) => row.isEditing),
  key,
  rows,
  title,
  total: options.total === undefined ? sumRows(rows) : options.total,
  emptyMessage: options.emptyMessage,
})

/** Le total porte sur toutes les lignes, les lignes masquées valant zéro ; l'affichage ne garde que les visibles. */
const buildTermSection = (
  key: ScenarioSectionKey,
  title: string,
  definitions: ScenarioRowDefinition[],
  breakdown: EstimationBreakdown,
  context: ScenarioContext,
  emptyMessage?: string,
): ScenarioSection => {
  const rows = definitions.map((definition) => buildTermRow(definition, breakdown, context))
  const section = buildSection(key, title, rows, { emptyMessage })
  return { ...section, rows: rows.filter((row, index) => isRowDisplayed(definitions[index], row)) }
}

export const buildScenarioSections = (breakdown: EstimationBreakdown, context: ScenarioContext): ScenarioSection[] => {
  const households = buildTermSection('households', 'Ménages à loger', HOUSEHOLDS_ROWS, breakdown, context)
  const parcOffer = buildTermSection('parcOffer', "Évolution de l'offre du parc", PARC_OFFER_ROWS, breakdown, context)
  // Affiché même à zéro : dire qu'aucun logement n'est mobilisable est une information en soi.
  const mobilisable = buildTermSection(
    'mobilisable',
    'Logements mobilisables dans le parc existant',
    MOBILISABLE_ROWS,
    breakdown,
    context,
    'Aucun logement mobilisable à ce stade du paramétrage.',
  )

  // I = A + B + C + D + E + F
  const additionalNeed = households.total === null ? null : households.total + (parcOffer.total ?? 0)
  // II = G + H + I + J, à venir tant que le bloc des logements mobilisables n'est pas chiffré
  const optimisation = additionalNeed === null ? null : mobilisable.total

  // Le récapitulatif est un solde, jamais « en cours » : il bouge à chaque étape.
  const summaryRow = (key: string, label: string, value: number | null, step: WizardStepSlug = SUMMARY_STEP): ScenarioRow => ({
    ...buildRow({ key, label, step }, value, context),
    isEditing: false,
  })

  const housingToFind = buildSection(
    'housingToFind',
    'Besoin en logements supplémentaires',
    [
      summaryRow('optimisation', 'Optimisation du parc existant', optimisation, OPTIMISATION_STEP),
      summaryRow('newConstruction', 'Constructions neuves', additionalNeed === null ? null : additionalNeed - (optimisation ?? 0)),
    ],
    { total: additionalNeed },
  )

  return [households, parcOffer, mobilisable, housingToFind]
}
