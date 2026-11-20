import { buildEstimationBreakdown, EstimationBreakdownInput } from '@otelo/shared'
import { TAmfAnswers, TAmfResult } from './amf.schemas'
import { roundForDisplay, toRange } from './amf-rounding'
import { AMF_HORIZON, TAmfVariant } from './amf-scenario'

export const roundToTen = (value: number) => Math.round(value / 10) * 10

/** Part du besoin total que représentent les résidences secondaires récupérées quand la baisse du taux n'y suffit pas. */
const SECONDARY_RESIDENCES_RECOVERY_SHARE = 0.02

export type TAnnualContributions = {
  households: number
  badHousing: number
  fluidity: number
  vacancyRemobilised: number
  secondaryResidences: number
  total: number
}

/**
 * Contributions annuelles d'une variante, moyennées sur la période de base à l'horizon.
 *
 * Le mal-logement arrive déjà proratisé par le moteur jusqu'à l'horizon de projection, selon l'année de résorption
 * du scénario. Les résidences secondaires suivent la réponse : « stable » les neutralise, « récupération » garantit
 * une contribution négative d'au moins 2 % du besoin.
 */
export function annualContributions(
  results: EstimationBreakdownInput,
  epciCode: string,
  baseYear: number,
  secondaryResidences: TAmfAnswers['secondaryResidences'],
): TAnnualContributions {
  const { values } = buildEstimationBreakdown(results, { epciCode })
  const years = Math.max(AMF_HORIZON - baseYear, 1)

  const shortTerm = values.fluidity - values.fluidityReleased
  const longTerm = values.vacancyIncrease - values.vacancyRemobilised

  const households = (values.demographic + values.disappearanceSurplus - values.appearanceSurplus) / years
  const badHousing = values.badHousing / years
  const fluidity = (Math.max(0, shortTerm) + Math.max(0, longTerm)) / years
  const vacancyRemobilised = (Math.max(0, -shortTerm) + Math.max(0, -longTerm)) / years

  const withoutSecondary = households + badHousing + fluidity - vacancyRemobilised
  const computedSecondary = (values.secondaryIncrease - values.secondaryDecrease) / years
  let secondary = computedSecondary
  if (secondaryResidences === 'stable') {
    secondary = 0
  } else if (secondaryResidences === 'recuperation' && computedSecondary >= 0) {
    secondary = -SECONDARY_RESIDENCES_RECOVERY_SHARE * Math.max(0, withoutSecondary)
  }

  return {
    households,
    badHousing,
    fluidity,
    vacancyRemobilised,
    secondaryResidences: secondary,
    total: withoutSecondary + secondary,
  }
}

/** Contributions annuelles des deux variantes, avant arrondi. */
export function amfVariantContributions(
  results: Record<TAmfVariant, EstimationBreakdownInput>,
  answers: Pick<TAmfAnswers, 'epciCode' | 'secondaryResidences'>,
  baseYear: number,
): Record<TAmfVariant, TAnnualContributions> {
  return {
    low: annualContributions(results.low, answers.epciCode, baseYear, answers.secondaryResidences),
    high: annualContributions(results.high, answers.epciCode, baseYear, answers.secondaryResidences),
  }
}

export function buildAmfResult(contributions: Record<TAmfVariant, TAnnualContributions>, baseYear: number): TAmfResult {
  const { low, high } = contributions
  const annual = toRange(Math.max(0, low.total), Math.max(0, high.total))

  // Un besoin qui s'arrondit à 0 logement par an est traité comme nul.
  if (!annual || annual.max <= 0) {
    return { baseYear, horizon: AMF_HORIZON, annual: null, contributions: null }
  }

  const range = (key: keyof TAnnualContributions) => toRange(low[key], high[key])

  return {
    baseYear,
    horizon: AMF_HORIZON,
    annual,
    contributions: {
      households: range('households'),
      badHousing: range('badHousing'),
      fluidity: roundForDisplay((low.fluidity + high.fluidity) / 2) || null,
      vacancyRemobilised: range('vacancyRemobilised'),
      secondaryResidences: range('secondaryResidences'),
    },
  }
}
