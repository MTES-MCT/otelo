import { fr } from '@codegouvfr/react-dsfr'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import type { TooltipContentProps } from 'recharts'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tss } from 'tss-react'
import { barChartColors } from '~/components/charts/data-visualisation/colors'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { TRPPopulationEvolution } from '~/schemas/population-evolution'
import { formatNumber } from '~/utils/format-numbers'

export type PopulationEvolutionChartProps = {
  data: TRPPopulationEvolution
  type: string | null
}

export const PopulationEvolutionChart: FC<PopulationEvolutionChartProps> = ({ data: chartData, type }) => {
  const [queryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epci: parseAsString.withDefault(''),
  })
  const { classes } = useStyles()

  const customLineTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className={classes.tooltip}>
          <p className={classes.tooltipTitle}>Année {label}</p>
          {payload.map((entry, index) => (
            <div key={index} className={classes.tooltipRow}>
              <span className={classes.tooltipColorBox} style={{ backgroundColor: entry.stroke }} />
              <span className={classes.tooltipLabel}>
                {entry.name}: <strong>{formatNumber(entry.value ?? 0)}</strong>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const customBarTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className={classes.tooltip}>
          <p className={classes.tooltipTitle}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className={classes.tooltipRow}>
              <span className={classes.tooltipColorBox} style={{ backgroundColor: entry.color }} />
              <span className={classes.tooltipLabel}>
                {entry.name}: <strong>{formatNumber(entry.value ?? 0)}</strong>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const customLegend = (items: Array<{ name: string; color: string }>) => {
    return (
      <div className={classes.legend}>
        {items.map((item, index) => (
          <div key={index} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: item.color }} />
            <span className={classes.legendLabel}>{item.name}</span>
          </div>
        ))}
      </div>
    )
  }
  const epcisLinearChart = Object.keys(chartData.linearChart).filter((epci) => queryStates.epcis.includes(epci))
  const linearDataKey = type?.split('-')[0]
  const epciName = chartData.tableData[queryStates.epci as string]?.name

  const periods = Array.from(new Set(Object.values(chartData.tableData).flatMap((row) => Object.keys(row.annualEvolution ?? {})))).sort()

  const allYears = periods.flatMap((p) => p.split('-').map(Number)).filter(Boolean)
  const minYear = allYears.length ? Math.min(...allYears) : 2010
  const maxYear = allYears.length ? Math.max(...allYears) : 2021

  const barChartData = Object.entries(chartData.tableData)
    .filter(([key]) => queryStates.epcis.includes(key))
    .map(([key, value]) => ({
      ...Object.fromEntries(periods.map((p) => [p, value.annualEvolution?.[p]?.value ?? 0])),
      epciCode: key,
      name: value.name,
    }))

  const title = type && DATA_TYPE_OPTIONS.find((option) => option.value === type)?.label
  const periodLabel = periods.join(' et ')
  const barChartTitle =
    type === 'menage-evolution' ? (
      <>Comparaison de l'évolution annuelle moyenne du nombre de ménages entre {periodLabel}</>
    ) : (
      <>Comparaison de l'évolution annuelle moyenne du nombre d'habitants entre {periodLabel}</>
    )
  const lineChartTitle =
    type === 'menage-evolution' ? (
      <>
        Evolution du nombre de ménages entre {minYear} et {maxYear}
      </>
    ) : (
      <>
        Évolution de la population entre {minYear} et {maxYear}
      </>
    )
  return (
    <>
      <h2 className={fr.cx('fr-h5')}>
        {title} - {epciName}
      </h2>

      <div className={classes.chartContainer}>
        <div className={classes.chartLabelContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart width={500} height={500} margin={{ left: 20, right: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" type="number" scale="linear" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} />

              {epcisLinearChart.length > 0 && (
                <YAxis
                  dataKey={linearDataKey}
                  domain={(() => {
                    const allMetadata = epcisLinearChart.map((epci) => chartData.linearChart[epci].metadata)
                    const minValues = allMetadata.map((m) => m.min)
                    const maxValues = allMetadata.map((m) => m.max)
                    const globalMin = Math.min(...minValues)
                    const globalMax = Math.max(...maxValues)

                    const padding = (globalMax - globalMin) * 0.05
                    return [Math.max(0, Math.round(globalMin - padding)), Math.round(globalMax + padding)]
                  })()}
                />
              )}
              <Tooltip content={customLineTooltip} />
              {epcisLinearChart.map((epci, index) => {
                const data = chartData.linearChart[epci].data
                return (
                  <Line
                    dataKey={linearDataKey}
                    stroke={barChartColors[index]}
                    data={data}
                    name={chartData.linearChart[epci].epci.name}
                    key={epci}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
          <div className={classes.chartTitle}>{lineChartTitle}</div>
          {customLegend(
            epcisLinearChart.map((epci, index) => ({
              name: chartData.linearChart[epci].epci.name,
              color: barChartColors[index],
            })),
          )}
        </div>
        <div className={classes.chartLabelContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={730} height={600} data={barChartData} margin={{ bottom: 130, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip content={customBarTooltip} />
              {periods.map((p, i) => (
                <Bar key={p} dataKey={p} name={p} fill={barChartColors[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className={classes.chartTitle}>{barChartTitle}</div>
          {customLegend(periods.map((p, i) => ({ name: p, color: barChartColors[i] })))}
        </div>
      </div>
    </>
  )
}

const useStyles = tss.create({
  chartContainer: {
    display: 'flex',
    gap: '2rem',
    height: '700px',
    width: '100%',
  },
  chartLabelContainer: {
    width: '100%',
    marginBottom: '2rem',
  },
  chartTitle: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '16px',
    fontWeight: 500,
    color: '#161616',
  },
  tooltip: {
    backgroundColor: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '0.75rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  tooltipTitle: {
    margin: '0 0 0.5rem 0',
    fontWeight: 700,
    fontSize: '14px',
    color: '#161616',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  tooltipColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
  },
  tooltipLabel: {
    fontSize: '13px',
    color: '#3a3a3a',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8125rem',
  },
  legendColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '0.8125rem',
    color: '#161616',
  },
})
