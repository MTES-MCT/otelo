import { buildEstimationBreakdown, EstimationBreakdownInput } from '@otelo/shared'
import { TAmfResult } from './amf.schemas'
import { COARSE_STEPS, FINE_STEPS, toRange } from './amf-range'
import { AMF_HORIZON } from './amf-scenario'

export const roundToTen = (value: number) => Math.round(value / 10) * 10

/** Le détail du pic de ménages, porté par `flowRequirement.epcis[].data` dans les résultats du moteur. */
type TPeakYearInput = { flowRequirement: { epcis: Array<{ code: string; data?: { peakYear: number } }> } }

/**
 * Année du pic de ménages quand elle précède l'horizon, `null` sinon.
 *
 * Le moteur ne compte les besoins que jusqu'au pic : au-delà, la baisse du nombre de ménages libère du
 * parc. Un pic égal à l'année de base signale un territoire déjà en baisse.
 */
const peakYearBeforeHorizon = (results: TPeakYearInput, epciCode: string): number | null => {
  const peakYear = results.flowRequirement.epcis.find((epci) => epci.code === epciCode)?.data?.peakYear
  return peakYear !== undefined && peakYear < AMF_HORIZON ? peakYear : null
}

export function buildAmfResult(
  results: EstimationBreakdownInput & TPeakYearInput & { total: number },
  epciCode: string,
  baseYear: number,
): TAmfResult {
  const rawTotal = results.epcisTotals.find((epci) => epci.epciCode === epciCode)?.total ?? 0
  const peakYear = peakYearBeforeHorizon(results, epciCode)
  const empty = { baseYear, horizon: AMF_HORIZON, peakYear, total: null, annualAverage: null, blocks: null }

  // Un besoin qui s'arrondit à 0 logement est traité comme nul.
  if (roundToTen(rawTotal) <= 0) {
    return empty
  }

  const { values } = buildEstimationBreakdown(results, { epciCode })
  const vacancy = values.vacancyIncrease - values.vacancyRemobilised
  const secondaryResidences = values.secondaryIncrease - values.secondaryDecrease
  const badHousing = values.badHousing
  const population = rawTotal - vacancy - secondaryResidences - badHousing

  // Le besoin se construit jusqu'au pic : la moyenne annuelle se calcule sur cette période.
  const lastYear = peakYear ?? AMF_HORIZON
  const years = Math.max(lastYear - baseYear, 1)
  const coarse = (value: number) => toRange(value, COARSE_STEPS, 50)

  return {
    baseYear,
    horizon: AMF_HORIZON,
    peakYear,
    total: toRange(rawTotal, FINE_STEPS, 50),
    annualAverage: toRange(rawTotal / years, FINE_STEPS, 10),
    blocks: {
      population: coarse(population),
      vacancy: coarse(vacancy),
      secondaryResidences: coarse(secondaryResidences),
      badHousing: coarse(badHousing),
    },
  }
}
