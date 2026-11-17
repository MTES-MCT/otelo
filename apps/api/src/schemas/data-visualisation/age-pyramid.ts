import { z } from 'zod'
import { ZProjectionZone } from '~/schemas/projections/projections'

/**
 * Pyramide des âges, alimentée par `projection_population_by_age_sex`.
 *
 * La réponse porte **toutes** les années de la projection et non deux : la restitution est un
 * curseur d'année, et un appel par cran le rendrait inutilisable. Elle porte de même le détail par
 * âge et non des tranches, la densité d'affichage étant elle aussi réglable sans rechargement.
 */

/** Âge maximal de la source, `99` regroupant « 99 ans et plus ». */
export const MAX_AGE = 99

export const AGE_COUNT = MAX_AGE + 1

/**
 * Variante de population. La variante de *cohabitation* (B/C/H) n'entre pas ici : elle ne joue pas
 * sur la population par âge et sexe. Contrôlé sur le millésime 2022 — 150 lignes divergentes sur
 * 3 472 200, toutes des zéros aberrants aux âges 96 à 98 sur 13 zones. La colonne `…C` est donc
 * retenue comme canonique.
 */
export const ZAgePyramidPopulationType = z.enum(['basse', 'central', 'haute'])
export type TAgePyramidPopulationType = z.infer<typeof ZAgePyramidPopulationType>

export const POPULATION_TYPE_TO_SCENARIO = {
  basse: 'pbC',
  central: 'centralC',
  haute: 'phC',
} as const satisfies Record<TAgePyramidPopulationType, string>

/**
 * Effectifs d'un âge, indexés comme `years`.
 *
 * Le détail par âge est renvoyé tel quel plutôt que pré-agrégé en tranches : la restitution offre
 * une bascule de densité, et regrouper côté serveur obligerait à un aller-retour à chaque
 * basculement. Le surcoût est de 100 âges au lieu de 20 tranches, soit ~5 800 valeurs pour une
 * zone — sans commune mesure avec une requête de plus.
 */
export const ZAgePyramidAge = z.object({
  age: z.number().int(),
  men: z.array(z.number()),
  women: z.array(z.number()),
})
export type TAgePyramidAge = z.infer<typeof ZAgePyramidAge>

export const ZAgePyramidAvailable = z.object({
  available: z.literal(true),
  zone: ZProjectionZone,
  /**
   * `BASSIN` quand l'EPCI n'a pas de projection propre (seuil de robustesse Omphale à
   * 50 000 habitants) : les effectifs sont ceux de son bassin d'habitat, pas les siens. À
   * signaler dans l'interface, pas en note de bas de page.
   */
  coverage: z.enum(['EPCI', 'BASSIN']),
  populationType: ZAgePyramidPopulationType,
  /** Année de référence : le millésime du pack, qui est aussi l'année de base des calculs. */
  referenceYear: z.number().int(),
  /** Années couvertes, croissantes, à partir de `referenceYear`. */
  years: z.array(z.number().int()),
  ages: z.array(ZAgePyramidAge),
})

export const ZAgePyramidUnavailable = z.object({
  available: z.literal(false),
  epciCode: z.string(),
  /**
   * `NO_PROJECTION` : ni projection propre, ni bassin projeté.
   * `AMBIGUOUS_BASSIN` : plusieurs zones se partagent le bassin — le cas de la Métropole du Grand
   * Paris, découpée en 12 territoires dont deux ne sont pas projetés. Les additionner amputerait
   * la métropole de 16 % de sa population ; mieux vaut ne rien afficher qu'un total faux.
   */
  reason: z.enum(['NO_PROJECTION', 'AMBIGUOUS_BASSIN']),
})

export const ZAgePyramid = z.discriminatedUnion('available', [ZAgePyramidAvailable, ZAgePyramidUnavailable])
export type TAgePyramid = z.infer<typeof ZAgePyramid>
