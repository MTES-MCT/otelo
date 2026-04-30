import { TSimulationDashboardItem } from '~/schemas/simulation'
import { formatNumber } from '~/utils/format-numbers'
import { getDecohabitationBadge, getPopulationBadge } from '~/utils/omphale-label'

export type RateEvolution = { points: number; label: string }
export type EvolutionDirection = 'lower-is-better' | 'higher-is-better'

export type ComparisonValue =
  | { kind: 'text'; text: string; evolution?: RateEvolution }
  | { kind: 'byEpci'; entries: Array<{ epciCode: string; epciName: string; label: string; evolution?: RateEvolution }> }

export interface ComparisonRow {
  label: string
  badge?: string
  value: ComparisonValue
  variant: 'light' | 'default'
  evolutionDirection?: EvolutionDirection
}

const formatRate = (decimal: number): string => `${(decimal * 100).toFixed(1).replace('.', ',')} %`

const formatEvolution = (points: number): RateEvolution => {
  const rounded = Math.round(points * 10) / 10
  if (Math.abs(rounded) < 0.05) return { points: 0, label: '0 pt' }
  const sign = rounded > 0 ? '+' : '-'
  const abs = Math.abs(rounded).toFixed(1).replace('.', ',')
  return { points: rounded, label: `${sign}${abs} pts` }
}

const allEqual = (values: number[], tolerance = 1e-6): boolean =>
  values.length <= 1 || values.every((v) => Math.abs(v - values[0]) < tolerance)

const dash: ComparisonValue = { kind: 'text', text: '—' }

export function buildComparisonRows(
  simulation: TSimulationDashboardItem,
  ctx: { projection: number; epcis: Array<{ code: string; name: string }> },
): ComparisonRow[] {
  const { scenario, summary } = simulation
  const { projection, epcis } = ctx

  const epciNameByCode = new Map(epcis.map((e) => [e.code, e.name]))
  const scenarioEpcis = scenario.epciScenarios

  const vacancyValues = scenarioEpcis.map((e) => e.b2_tx_vacance)
  const rsValues = scenarioEpcis.map((e) => e.b2_tx_rs)

  type RateField = 'b2_tx_vacance' | 'b2_tx_rs'
  type BaselineField = 'vacancyRate' | 'txRs'

  const buildRateValue = (rateField: RateField, baselineField: BaselineField, values: number[]): ComparisonValue => {
    if (scenarioEpcis.length === 0) return dash

    const evolutions = scenarioEpcis.map((e) => {
      const baseline = e.baseline?.[baselineField]
      if (typeof baseline !== 'number') return undefined
      return formatEvolution((e[rateField] - baseline) * 100)
    })

    const allBaselinesPresent = evolutions.every((evo) => evo !== undefined)
    const evolutionsEqual = allBaselinesPresent && allEqual(evolutions.map((evo) => (evo as RateEvolution).points))

    if (allEqual(values) && evolutionsEqual) {
      return {
        kind: 'text',
        text: formatRate(values[0]),
        evolution: evolutions[0],
      }
    }

    return {
      kind: 'byEpci',
      entries: scenarioEpcis.map((e, i) => ({
        epciCode: e.epciCode,
        epciName: epciNameByCode.get(e.epciCode) ?? e.epciCode,
        label: formatRate(e[rateField]),
        evolution: evolutions[i],
      })),
    }
  }

  const constructionsNeuvesValue: ComparisonValue = summary
    ? { kind: 'text', text: `${formatNumber(summary.total)} logements neufs` }
    : dash

  const logementsRemobilisesValue: ComparisonValue = summary
    ? { kind: 'text', text: `${formatNumber(summary.vacantAccomodation + summary.secondaryAccommodation)} logements` }
    : dash

  const populationValue: ComparisonValue = summary
    ? { kind: 'text', text: `${formatNumber(summary.populationAtProjection)} habitants en ${projection}` }
    : dash

  const householdsValue: ComparisonValue = summary
    ? { kind: 'text', text: `${formatNumber(summary.householdsAtProjection)} ménages en ${projection}` }
    : dash

  const peakYearValue: ComparisonValue =
    summary && summary.peakYear !== null && summary.peakYear < projection
      ? { kind: 'text', text: String(summary.peakYear) }
      : { kind: 'text', text: '—' }

  const renewalValue: ComparisonValue = (() => {
    if (!summary) return dash
    const n = Math.round(summary.renewalNeeds)
    if (n === 0) return { kind: 'text', text: 'Sans effet' }
    return { kind: 'text', text: `${formatNumber(Math.abs(n))} logements` }
  })()

  const resorptionValue: ComparisonValue = scenario.b1_horizon_resorption
    ? { kind: 'text', text: String(scenario.b1_horizon_resorption) }
    : dash

  return [
    { label: 'Constructions neuves', value: constructionsNeuvesValue, variant: 'light' },
    { label: 'Logements existants remobilisés', value: logementsRemobilisesValue, variant: 'light' },
    { label: 'Renouvellement urbain', value: renewalValue, variant: 'light' },
    {
      label: 'Projection de population',
      badge: getPopulationBadge(scenario.b2_scenario),
      value: populationValue,
      variant: 'default',
    },
    {
      label: 'Projection des résidences principales',
      badge: getDecohabitationBadge(scenario.b2_scenario),
      value: householdsValue,
      variant: 'default',
    },
    {
      label: 'Taux de logements vacants',
      value: buildRateValue('b2_tx_vacance', 'vacancyRate', vacancyValues),
      variant: 'default',
      evolutionDirection: 'lower-is-better',
    },
    {
      label: 'Taux de résidences secondaires',
      value: buildRateValue('b2_tx_rs', 'txRs', rsValues),
      variant: 'default',
      evolutionDirection: 'lower-is-better',
    },
    { label: 'Résorption mal-logement', value: resorptionValue, variant: 'default' },
    { label: 'Pic de ménages', value: peakYearValue, variant: 'default' },
  ]
}
