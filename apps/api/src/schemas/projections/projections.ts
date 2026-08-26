import { z } from 'zod'

/** Première et dernière année couvertes par les classeurs de projections. */
export const PROJECTION_FIRST_YEAR = 2018
export const PROJECTION_LAST_YEAR = 2050

/** Nombre maximal de zones interrogeables en une requête. */
const MAX_ZONES = 50

/**
 * Plafond de lignes d'une réponse de série détaillée. Sans lui, 50 zones × 33 ans × 100 âges ×
 * 2 sexes tiendraient dans une seule requête, soit 330 000 lignes à sérialiser.
 */
const MAX_DETAILED_ROWS = 20_000

export const ZProjectionScenario = z.enum(['centralB', 'centralC', 'centralH', 'phB', 'phC', 'phH', 'pbB', 'pbC', 'pbH'])
export type TProjectionScenario = z.infer<typeof ZProjectionScenario>

export const PROJECTION_SCENARIOS = ZProjectionScenario.options

export const ZProjectionZoneLevel = z.enum(['EPCI', 'BH'])
export type TProjectionZoneLevel = z.infer<typeof ZProjectionZoneLevel>

export const ZProjectionSex = z.enum(['HOMME', 'FEMME'])

/**
 * Tranches d'âge, nommées comme les valeurs de l'enum Prisma et non comme les libellés source.
 * La base stocke bien `<18`, `65+`… (`@map` sur l'enum), ce qui garde les requêtes de contrôle
 * lisibles ; mais ces libellés feraient de mauvaises valeurs d'API — `<` et `+` demandent un
 * encodage dans une query string.
 *
 * ⚠ Les tranches se recouvrent : `PLUS_DE_85` est un sous-ensemble de `PLUS_DE_65`. Le total se
 * reconstitue avec les cinq autres.
 */
export const ZProjectionAgeGroup = z.enum(['MOINS_DE_18', 'DE_18_A_29', 'DE_30_A_44', 'DE_45_A_64', 'PLUS_DE_65', 'PLUS_DE_85'])

/**
 * Typologies de ménages. Même principe que les tranches d'âge : `MENAGE_COMPLEXE_3_PLUS` est
 * stocké `MENAGE_COMPLEXE_3+` en base.
 *
 * ⚠ `ENFANT` et `HORS_MENAGE` valent 0 sur l'intégralité de la source. Ils sont exposés par
 * fidélité, ce ne sont pas des effectifs exploitables.
 */
export const ZProjectionHouseholdType = z.enum([
  'COUPLE',
  'ENFANT',
  'FAMILLE_MONOPARENTALE',
  'HORS_MENAGE',
  'MENAGE_COMPLEXE_2',
  'MENAGE_COMPLEXE_3_PLUS',
  'PERSONNE_SEULE',
])

/** Liste séparée par des virgules dans la query string. */
function commaSeparated<T extends z.ZodTypeAny>(item: T, max: number) {
  return z.preprocess(
    (value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry !== '')
        : value,
    z.array(item).min(1).max(max),
  )
}

export const ZProjectionZonesQuery = z.object({
  level: ZProjectionZoneLevel.optional().describe('Filtre sur le niveau géographique'),
  bassinName: z.string().optional().describe("Libellé exact d'un bassin d'habitat"),
  search: z.string().optional().describe('Recherche sur le code ou le libellé de la zone'),
  millesime: z.string().optional().describe('Millésime du pack de données (défaut : millésime actif)'),
})
export type TProjectionZonesQuery = z.infer<typeof ZProjectionZonesQuery>

export const ZResolveProjectionZonesQuery = z.object({
  epciCodes: commaSeparated(z.string(), MAX_ZONES).describe('Codes EPCI séparés par des virgules'),
  millesime: z.string().optional(),
})
export type TResolveProjectionZonesQuery = z.infer<typeof ZResolveProjectionZonesQuery>

const ZProjectionSeriesQueryBase = z.object({
  zoneCodes: commaSeparated(z.string(), MAX_ZONES).describe(
    'Codes de zone séparés par des virgules. Les codes EPCI et bassin sont disjoints, le niveau est donc implicite.',
  ),
  level: ZProjectionZoneLevel.optional().describe(
    "Niveau attendu. Fourni, il fait échouer la requête si l'un des codes relève de l'autre niveau.",
  ),
  millesime: z.string().optional().describe('Millésime du pack de données (défaut : millésime actif)'),
  fromYear: z.coerce.number().int().min(PROJECTION_FIRST_YEAR).max(PROJECTION_LAST_YEAR).default(PROJECTION_FIRST_YEAR),
  toYear: z.coerce.number().int().min(PROJECTION_FIRST_YEAR).max(PROJECTION_LAST_YEAR).default(PROJECTION_LAST_YEAR),
  scenarios: commaSeparated(ZProjectionScenario, PROJECTION_SCENARIOS.length)
    .optional()
    .describe('Scénarios à renvoyer (défaut : les 9). `pb` = population basse, `ph` = population haute.'),
})

/** Ajoute l'anomalie « intervalle d'années inversé », commune à toutes les routes de série. */
function checkYearOrder(value: { fromYear: number; toYear: number }, ctx: z.RefinementCtx): void {
  if (value.fromYear > value.toYear) {
    ctx.addIssue({
      code: 'custom',
      path: ['fromYear'],
      message: `fromYear (${value.fromYear}) doit être antérieure ou égale à toYear (${value.toYear})`,
    })
  }
}

export const ZProjectionSeriesQuery = ZProjectionSeriesQueryBase.superRefine(checkYearOrder)
export type TProjectionSeriesQuery = z.infer<typeof ZProjectionSeriesQuery>

export const ZProjectionBySexQuery = ZProjectionSeriesQueryBase.extend({
  sex: ZProjectionSex.optional().describe('Restreindre à un sexe'),
}).superRefine(checkYearOrder)
export type TProjectionBySexQuery = z.infer<typeof ZProjectionBySexQuery>

export const ZProjectionByAgeGroupQuery = ZProjectionSeriesQueryBase.extend({
  ageGroups: commaSeparated(ZProjectionAgeGroup, 6)
    .optional()
    .describe('⚠ Les tranches se recouvrent : PLUS_DE_85 est un sous-ensemble de PLUS_DE_65.'),
}).superRefine(checkYearOrder)
export type TProjectionByAgeGroupQuery = z.infer<typeof ZProjectionByAgeGroupQuery>

export const ZProjectionByHouseholdTypeQuery = ZProjectionSeriesQueryBase.extend({
  householdTypes: commaSeparated(ZProjectionHouseholdType, 7)
    .optional()
    .describe('⚠ ENFANT et HORS_MENAGE sont à 0 dans toute la source, ce ne sont pas des effectifs.'),
}).superRefine(checkYearOrder)
export type TProjectionByHouseholdTypeQuery = z.infer<typeof ZProjectionByHouseholdTypeQuery>

/**
 * Série détaillée par âge : la seule dont la volumétrie doit être bornée explicitement, le
 * produit zones × années × âges × sexes croissant beaucoup plus vite que pour les autres routes.
 */
export const ZProjectionByAgeQuery = ZProjectionSeriesQueryBase.extend({
  ages: commaSeparated(z.coerce.number().int().min(0).max(99), 100)
    .optional()
    .describe('Âges détaillés à renvoyer, de 0 à 99 (99 regroupant « 99 ans et plus »)'),
  sex: ZProjectionSex.optional(),
}).superRefine((value, ctx) => {
  checkYearOrder(value, ctx)

  const years = value.toYear - value.fromYear + 1
  const ages = value.ages?.length ?? 100
  const sexes = value.sex === undefined ? 2 : 1
  const rows = value.zoneCodes.length * years * ages * sexes

  if (rows > MAX_DETAILED_ROWS) {
    ctx.addIssue({
      code: 'custom',
      path: ['zoneCodes'],
      message:
        `Requête trop large : ${rows} lignes pour un maximum de ${MAX_DETAILED_ROWS} ` +
        `(${value.zoneCodes.length} zone(s) × ${years} année(s) × ${ages} âge(s) × ${sexes} sexe(s)). ` +
        'Resserrer zoneCodes, fromYear/toYear, ages ou sex.',
    })
  }
})
export type TProjectionByAgeQuery = z.infer<typeof ZProjectionByAgeQuery>

export const ZProjectionZone = z.object({
  code: z.string(),
  level: ZProjectionZoneLevel,
  label: z.string(),
  epciCode: z.string().nullable(),
  bassinName: z.string().nullable(),
})
export type TProjectionZone = z.infer<typeof ZProjectionZone>

export const ZProjectionZoneWithMillesime = ZProjectionZone.extend({
  /**
   * `false` : la zone n'est pas projetée — la série se réduit à l'année de recensement, dont la
   * valeur observée est recopiée sur les 9 scénarios. À ne jamais tracer comme une projection.
   */
  isRobust: z.boolean(),
  firstYear: z.number().int().nullable(),
  lastYear: z.number().int().nullable(),
})
export type TProjectionZoneWithMillesime = z.infer<typeof ZProjectionZoneWithMillesime>

export const ZResolvedProjectionZones = z.object({
  epciCode: z.string(),
  /** Projection propre à l'EPCI : absente en dessous de 50 000 habitants. */
  epciZone: ZProjectionZoneWithMillesime.nullable(),
  /**
   * Zones du bassin de l'EPCI. Un tableau et non une zone unique : la Métropole du Grand Paris est
   * découpée en 12 territoires qui partagent le bassin « PARIS MÉTROPOLE », dont deux ne sont pas
   * projetés — les agréger sans vérifier `isRobust` amputerait la métropole de 16 %.
   */
  bassinZones: z.array(ZProjectionZoneWithMillesime),
})
export type TResolvedProjectionZones = z.infer<typeof ZResolvedProjectionZones>

const ZScenarioValues = z.object({
  centralB: z.number().nullable().optional(),
  centralC: z.number().nullable().optional(),
  centralH: z.number().nullable().optional(),
  phB: z.number().nullable().optional(),
  phC: z.number().nullable().optional(),
  phH: z.number().nullable().optional(),
  pbB: z.number().nullable().optional(),
  pbC: z.number().nullable().optional(),
  pbH: z.number().nullable().optional(),
})

export const ZProjectionSeriesPoint = ZScenarioValues.extend({
  year: z.number().int(),
  age: z.number().int().optional(),
  sex: ZProjectionSex.optional(),
  ageGroup: ZProjectionAgeGroup.optional(),
  householdType: ZProjectionHouseholdType.optional(),
})
export type TProjectionSeriesPoint = z.infer<typeof ZProjectionSeriesPoint>

export const ZProjectionSeries = z.object({
  zone: ZProjectionZone,
  isRobust: z.boolean(),
  data: z.array(ZProjectionSeriesPoint),
  metadata: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    firstYear: z.number().int().nullable(),
    lastYear: z.number().int().nullable(),
  }),
})
export type TProjectionSeries = z.infer<typeof ZProjectionSeries>

/** Réponse des routes de série : une entrée par zone demandée, indexée par son code. */
export const ZProjectionSeriesByZone = z.record(z.string(), ZProjectionSeries)
export type TProjectionSeriesByZone = z.infer<typeof ZProjectionSeriesByZone>
