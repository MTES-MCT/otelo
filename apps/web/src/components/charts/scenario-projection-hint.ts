import { formatNumber } from '~/utils/format-numbers'

/** Valeur projetée d'un scénario à l'horizon, et son évolution depuis le millésime. */
export type ScenarioProjection = { value: number; evolutionPercent: number }

export const getScenarioProjection = (base?: number | null, atHorizon?: number | null): ScenarioProjection | undefined => {
  if (base == null || atHorizon == null || base <= 0) return undefined
  return { value: atHorizon, evolutionPercent: ((atHorizon - base) / base) * 100 }
}

const formatPercent = (value: number): string => {
  // Une décimale sous 1 % : arrondie à l'entier, une faible évolution s'afficherait « 0 % ».
  const rounded = Math.abs(value) < 1 ? Math.round(value * 10) / 10 : Math.round(value)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${String(Math.abs(rounded)).replace('.', ',')} %`
}

/**
 * Sous-texte d'une option de scénario, ex. « 50 100 hab. en 2046 (+1 %) ».
 *
 * Arrondi à la centaine : c'est un ordre de grandeur pour comparer les scénarios entre eux,
 * la valeur exacte reste lisible au survol du graphique.
 */
export const formatScenarioProjection = (projection: ScenarioProjection, unit: string, horizon: string | number): string =>
  `${formatNumber(Math.round(projection.value / 100) * 100)} ${unit} en ${horizon} (${formatPercent(projection.evolutionPercent)})`
