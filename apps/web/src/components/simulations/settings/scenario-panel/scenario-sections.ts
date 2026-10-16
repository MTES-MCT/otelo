import { EstimationBreakdown, EstimationTermKey } from '@shared'
import { getStepIndex, getStepsForFlow, WizardFlow, WizardStepSlug } from '~/components/simulations/settings/wizard-steps'

/**
 * Registre de lecture de la colonne « Votre scénario » : comment les termes de l'estimation se
 * regroupent en lignes, à partir de quelle étape chaque ligne a un sens, et comment les blocs se
 * totalisent.
 *
 * Trois blocs, qui s'additionnent à l'écran :
 * - « Ménages à loger » : le besoin démographique et le mal-logement ;
 * - « Évolution de l'offre du parc » : ce que le parc consomme (vacance, résidences secondaires,
 *   disparitions) ;
 * - « Logements à trouver » = les deux premiers, répartis entre le parc existant, le renouvellement
 *   urbain et, pour le reste, la construction neuve.
 *
 * Le rattachement passe par le *slug* et jamais par un index en dur : le parcours de modification
 * n'a pas l'étape « choix du territoire » et décale tous les rangs (`wizard-steps.ts`).
 */

export type ScenarioSectionKey = 'households' | 'parcOffer' | 'housingToFind'

type ScenarioRowDefinition = {
  key: string
  label: string
  /** Termes sommés dans la ligne ; chacun n'est compté qu'une fois son étape atteinte. */
  terms: EstimationTermKey[]
  /** Étape à partir de laquelle la ligne est chiffrée, et pendant laquelle elle est signalée « en cours ». */
  step: WizardStepSlug
  /** Renvoie vers la note de bas de colonne. */
  footnote?: boolean
  /** La ligne porte le taux cible de vacance de longue durée, quand un seul EPCI est affiché. */
  showsLongTermVacancyRate?: boolean
}

const HOUSEHOLDS_ROWS: ScenarioRowDefinition[] = [
  { key: 'demographic', label: 'Évolution du nombre de ménages', step: 'parametrages-demographique', terms: ['demographic'] },
  { key: 'badHousing', label: 'Situations de mal-logement', step: 'parametrages-demographique', terms: ['badHousing'], footnote: true },
]

const PARC_OFFER_ROWS: ScenarioRowDefinition[] = [
  {
    key: 'longTermVacancy',
    label: 'Vacance longue durée',
    step: 'taux-cibles-logements-vacants',
    terms: ['fluidity', 'vacancyIncrease'],
    showsLongTermVacancyRate: true,
  },
  { key: 'secondaryResidences', label: 'Résidences secondaires', step: 'taux-cibles-residences-secondaires', terms: ['secondaryIncrease'] },
  { key: 'disappearance', label: 'Renouvellement urbain', step: 'taux-restructuration-disparition', terms: ['disappearanceSurplus'] },
]

const EXISTING_PARC_ROW: ScenarioRowDefinition = {
  key: 'existingParc',
  label: 'Dans le parc existant',
  step: 'taux-cibles-logements-vacants',
  terms: ['vacancyRemobilised', 'fluidityReleased', 'secondaryDecrease'],
}

const URBAN_RENEWAL_ROW: ScenarioRowDefinition = {
  key: 'urbanRenewal',
  label: 'En renouvellement urbain',
  step: 'taux-restructuration-disparition',
  terms: ['appearanceSurplus'],
}

/** Le reste du besoin, une fois retirés le parc existant et le renouvellement urbain. */
const NEW_CONSTRUCTION_STEP: WizardStepSlug = 'parametrages-demographique'

export type ScenarioRow = {
  key: string
  label: string
  /** `null` tant que l'étape de la ligne n'est pas atteinte. */
  value: number | null
  /** Libellé court de l'étape qui chiffrera la ligne, pour l'infobulle des lignes à venir. */
  stepLabel: string
  isEditing: boolean
  footnote: boolean
  showsLongTermVacancyRate: boolean
}

export type ScenarioSection = {
  key: ScenarioSectionKey
  title: string
  /** `null` tant qu'aucune ligne du bloc n'est chiffrée. */
  total: number | null
  rows: ScenarioRow[]
  /** Le bloc contient la ligne en cours de paramétrage. */
  isEditing: boolean
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
  showsLongTermVacancyRate: Boolean(definition.showsLongTermVacancyRate),
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

const buildSection = (key: ScenarioSectionKey, title: string, rows: ScenarioRow[], total = sumRows(rows)): ScenarioSection => ({
  isEditing: rows.some((row) => row.isEditing),
  key,
  rows,
  title,
  total,
})

export const buildScenarioSections = (breakdown: EstimationBreakdown, context: ScenarioContext): ScenarioSection[] => {
  const householdsRows = HOUSEHOLDS_ROWS.map((row) => buildTermRow(row, breakdown, context))
  const parcOfferRows = PARC_OFFER_ROWS.map((row) => buildTermRow(row, breakdown, context))
  const households = buildSection('households', 'Ménages à loger', householdsRows)
  const parcOffer = buildSection('parcOffer', "Évolution de l'offre du parc", parcOfferRows)

  const housingToFindTotal = households.total === null ? null : households.total + (parcOffer.total ?? 0)

  const existingParc = buildTermRow(EXISTING_PARC_ROW, breakdown, context)
  const urbanRenewal = buildTermRow(URBAN_RENEWAL_ROW, breakdown, context)
  // La construction neuve est un solde, jamais « en cours » : elle bouge à chaque étape.
  const newConstruction: ScenarioRow = {
    ...buildRow(
      { key: 'newConstruction', label: 'En construction neuve', step: NEW_CONSTRUCTION_STEP },
      housingToFindTotal === null ? null : housingToFindTotal - (existingParc.value ?? 0) - (urbanRenewal.value ?? 0),
      context,
    ),
    isEditing: false,
  }

  const housingToFind = buildSection(
    'housingToFind',
    'Logements à trouver',
    [existingParc, urbanRenewal, newConstruction],
    housingToFindTotal,
  )

  return [households, parcOffer, housingToFind]
}
