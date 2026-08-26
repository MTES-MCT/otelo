/**
 * Correspondance feuille source → table cible pour les classeurs « Projections détaillées ».
 *
 * Les deux classeurs (EPCI et bassin d'habitat) portent les six mêmes feuilles, aux mêmes
 * en-têtes : seule la sémantique de la colonne ZONE change. La configuration est donc unique.
 */

/** Dimension dépliée depuis les colonnes de mesure, en plus de (ZONE, ANNEE). */
export type ProjectionDimension = 'none' | 'sex' | 'ageGroup' | 'householdType'

export type ProjectionSheetConfig = {
  /** Nom de la feuille dans le classeur. */
  name: string
  /** Table PostgreSQL cible. */
  table: string
  /**
   * Colonnes de clé lues telles quelles dans la feuille, hors ZONE et ANNEE.
   * Ne concerne que `Population_age_sexe` (AGE) et `Population_agegrp` (AGE_GROUPE) ; la
   * dimension de `Population_sexe` et de `Menages_typologie` est portée par les en-têtes de
   * mesure, pas par une colonne.
   */
  sourceKeyColumns: { header: string; column: string }[]
  /** Dimension portée par le suffixe des en-têtes de mesure. */
  dimension: ProjectionDimension
}

export const PROJECTION_SHEETS: ProjectionSheetConfig[] = [
  {
    name: 'Population_totale',
    table: 'projection_population_totals',
    sourceKeyColumns: [],
    dimension: 'none',
  },
  {
    name: 'Population_sexe',
    table: 'projection_population_by_sex',
    sourceKeyColumns: [],
    dimension: 'sex',
  },
  {
    name: 'Population_age_sexe',
    table: 'projection_population_by_age_sex',
    sourceKeyColumns: [{ header: 'AGE', column: 'age' }],
    dimension: 'sex',
  },
  {
    name: 'Population_agegrp',
    table: 'projection_population_by_age_group',
    sourceKeyColumns: [{ header: 'AGE_GROUPE', column: 'age_group' }],
    dimension: 'ageGroup',
  },
  {
    name: 'Menages_totaux',
    table: 'projection_household_totals',
    sourceKeyColumns: [],
    dimension: 'none',
  },
  {
    name: 'Menages_typologie',
    table: 'projection_household_by_type',
    sourceKeyColumns: [],
    dimension: 'householdType',
  },
]

export const PROJECTION_SHEET_NAMES = PROJECTION_SHEETS.map((sheet) => sheet.name)

/** Colonne portant la dimension dépliée, côté base. */
export const DIMENSION_COLUMN: Record<Exclude<ProjectionDimension, 'none'>, string> = {
  sex: 'sex',
  ageGroup: 'age_group',
  householdType: 'household_type',
}

/** Les 9 colonnes de scénario, dans l'ordre d'insertion. */
export const SCENARIO_COLUMNS = ['central_b', 'central_c', 'central_h', 'ph_b', 'ph_c', 'ph_h', 'pb_b', 'pb_c', 'pb_h'] as const

export type ScenarioColumn = (typeof SCENARIO_COLUMNS)[number]

/** Année du recensement de départ : la seule pour laquelle la source peut porter deux lignes. */
export const BASE_YEAR = 2018
