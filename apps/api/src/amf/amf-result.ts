import { buildEstimationBreakdown, EstimationBreakdownInput } from '@otelo/shared'
import { TAmfResult } from './amf.schemas'
import { AMF_HORIZON } from './amf-scenario'

export const roundToTen = (value: number) => Math.round(value / 10) * 10

export function buildAmfResult(results: EstimationBreakdownInput & { total: number }, epciCode: string, baseYear: number): TAmfResult {
  const rawTotal = results.epcisTotals.find((epci) => epci.epciCode === epciCode)?.total ?? 0

  if (rawTotal <= 0) {
    return { baseYear, horizon: AMF_HORIZON, total: 0, annualAverage: 0, blocks: null }
  }

  const { values } = buildEstimationBreakdown(results, { epciCode })
  const total = roundToTen(rawTotal)
  if (total <= 0) {
    return { baseYear, horizon: AMF_HORIZON, total: 0, annualAverage: 0, blocks: null }
  }

  const vacancy = roundToTen(values.vacancyIncrease - values.vacancyRemobilised)
  const secondaryResidences = roundToTen(values.secondaryIncrease - values.secondaryDecrease)
  const badHousing = roundToTen(values.badHousing)
  const population = total - vacancy - secondaryResidences - badHousing

  return {
    baseYear,
    horizon: AMF_HORIZON,
    total,
    annualAverage: Math.round(rawTotal / (AMF_HORIZON - baseYear)),
    blocks: { population, vacancy, secondaryResidences, badHousing },
  }
}
