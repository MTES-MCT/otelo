import { type ScenarioColumn } from './projection-sheets.config'

/**
 * Lecture des en-têtes de mesure des classeurs « Projections détaillées ».
 *
 * Trois formes coexistent, selon la feuille :
 *   `POP_central_MC_BAS`                            → scénario seul
 *   `POP_central_MC_BAS_1`                          → scénario × sexe (1 = homme, 2 = femme)
 *   `NBMEN_central_MC_BAS_MENAGE_COMPLEXE_3+`       → scénario × typologie de ménage
 *
 * Le découpage doit s'ancrer sur les jetons connus plutôt que sur les `_` : la modalité
 * `MENAGE_COMPLEXE_3+` en contient elle-même, et un `split('_')` la tronquerait silencieusement.
 */
const MEASURE_HEADER = /^(POP|NBMEN)_(pop_basse|central|pop_haute)_(MC_BAS|MC_CENTRAL|MC_HAUT)(?:_(.+))?$/

const POPULATION_PREFIX: Record<string, string> = {
  pop_basse: 'pb',
  central: 'central',
  pop_haute: 'ph',
}

const COHABITATION_SUFFIX: Record<string, string> = {
  MC_BAS: 'b',
  MC_CENTRAL: 'c',
  MC_HAUT: 'h',
}

/**
 * Valeurs de l'enum `ProjectionSex` en base, indexées par le suffixe source.
 * La source code le sexe en 1/2 ; la base stocke des libellés, seule conversion nécessaire.
 */
export const SEX_BY_SOURCE_SUFFIX: Record<string, string> = {
  '1': 'HOMME',
  '2': 'FEMME',
}

/**
 * Modalités de `ProjectionHouseholdType`. Les libellés source sont stockés tels quels en base
 * (via `@map`), il n'y a donc pas de conversion — seulement une validation.
 *
 * ⚠ `ENFANT` et `HORS_MENAGE` sont à 0 sur l'intégralité des deux classeurs. Ils sont conservés
 * par fidélité au source, mais ne constituent pas des effectifs exploitables.
 */
export const HOUSEHOLD_TYPES = new Set([
  'COUPLE',
  'ENFANT',
  'FAMILLE_MONOPARENTALE',
  'HORS_MENAGE',
  'MENAGE_COMPLEXE_2',
  'MENAGE_COMPLEXE_3+',
  'PERSONNE_SEULE',
])

/** Modalités de `ProjectionAgeGroup`, stockées telles quelles en base (via `@map`). */
export const AGE_GROUPS = new Set(['<18', '18-29', '30-44', '45-64', '65+', '85+'])

export type ParsedMeasureHeader = {
  /** Colonne de scénario cible, ex. `central_b`. */
  column: ScenarioColumn
  /**
   * Valeur de la dimension dépliée, telle qu'elle sera écrite en base : `HOMME`/`FEMME` pour le
   * sexe, le libellé de typologie pour les ménages. `null` quand l'en-tête ne porte pas de
   * dimension.
   */
  dimensionValue: string | null
}

export class UnknownMeasureHeaderError extends Error {
  constructor(header: string, reason: string) {
    super(`En-tête de mesure non reconnu : « ${header} » (${reason})`)
    this.name = 'UnknownMeasureHeaderError'
  }
}

/**
 * Analyse un en-tête de mesure. Lève sur toute forme inconnue : une colonne silencieusement
 * ignorée serait une perte de données invisible au contrôle de volumétrie.
 */
export function parseMeasureHeader(header: string): ParsedMeasureHeader {
  const match = MEASURE_HEADER.exec(header.trim())
  if (match === null) {
    throw new UnknownMeasureHeaderError(header, 'ne suit pas la forme <POP|NBMEN>_<population>_<MC>[_<modalité>]')
  }

  const [, , population, cohabitation, modality] = match
  const column = `${POPULATION_PREFIX[population]}_${COHABITATION_SUFFIX[cohabitation]}` as ScenarioColumn

  if (modality === undefined) {
    return { column, dimensionValue: null }
  }

  const sex = SEX_BY_SOURCE_SUFFIX[modality]
  if (sex !== undefined) {
    return { column, dimensionValue: sex }
  }

  if (HOUSEHOLD_TYPES.has(modality)) {
    return { column, dimensionValue: modality }
  }

  throw new UnknownMeasureHeaderError(header, `modalité inconnue « ${modality} »`)
}

/** Vrai si l'en-tête est une colonne de mesure (et non une colonne de clé ou `ind_robust`). */
export function isMeasureHeader(header: string): boolean {
  return MEASURE_HEADER.test(header.trim())
}
