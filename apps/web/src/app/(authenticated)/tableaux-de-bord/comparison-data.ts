import { TSimulationDashboardItem } from '~/schemas/simulation'
import { formatNumber } from '~/utils/format-numbers'
import { getDecohabitationBadge, getPopulationBadge } from '~/utils/omphale-label'

export type ComparisonValue =
  | { kind: 'text'; text: string }
  | { kind: 'byEpci'; entries: Array<{ epciCode: string; epciName: string; label: string }> }

export interface ComparisonRow {
  label: string
  badge?: string
  value: ComparisonValue
  variant: 'light' | 'default'
}

const formatRate = (decimal: number): string => `${(decimal * 100).toFixed(1).replace('.', ',')} %`

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

  const buildRateValue = (pick: (e: { b2_tx_vacance: number; b2_tx_rs: number }) => number, values: number[]): ComparisonValue => {
    if (scenarioEpcis.length === 0) return dash
    if (allEqual(values)) return { kind: 'text', text: formatRate(values[0]) }
    return {
      kind: 'byEpci',
      entries: scenarioEpcis.map((e) => ({
        epciCode: e.epciCode,
        epciName: epciNameByCode.get(e.epciCode) ?? e.epciCode,
        label: formatRate(pick(e)),
      })),
    }
  }

  const constructionsNeuvesValue: ComparisonValue = summary
    ? { kind: 'text', text: `${formatNumber(summary.constructionsNeuves)} logements neufs` }
    : dash

  const logementsRemobilisesValue: ComparisonValue = summary
    ? { kind: 'text', text: `${formatNumber(summary.logementsRemobilises)} logements` }
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

  return [
    { label: 'Constructions neuves', value: constructionsNeuvesValue, variant: 'light' },
    { label: 'Logements existants remobilisés', value: logementsRemobilisesValue, variant: 'light' },
    {
      label: 'Projection de population',
      badge: getPopulationBadge(scenario.b2_scenario),
      value: populationValue,
      variant: 'default',
    },
    {
      label: 'Desserrement des ménages',
      badge: getDecohabitationBadge(scenario.b2_scenario),
      value: householdsValue,
      variant: 'default',
    },
    {
      label: 'Taux de logements vacants',
      value: buildRateValue((e) => e.b2_tx_vacance, vacancyValues),
      variant: 'default',
    },
    {
      label: 'Taux de résidences secondaires',
      value: buildRateValue((e) => e.b2_tx_rs, rsValues),
      variant: 'default',
    },
    { label: 'Renouvellement urbain', value: renewalValue, variant: 'default' },
    { label: 'Pic de ménages', value: peakYearValue, variant: 'default' },
  ]
}
