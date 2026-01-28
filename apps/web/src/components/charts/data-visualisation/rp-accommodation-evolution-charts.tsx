import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/Select'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import type { TooltipContentProps } from 'recharts'
import { Bar, BarChart, CartesianGrid, Label, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tss } from 'tss-react'
import { getChartColor } from '~/components/charts/data-visualisation/colors'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { TAccommodationEvolution } from '~/schemas/accommodation-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './accommodation-evolution-charts.module.css'

export type RPAccommodationEvolutionChart = {
  data: TAccommodationEvolution
  type: string | null
}

export const RPAccommodationEvolutionChart: FC<RPAccommodationEvolutionChart> = ({ data: chartData, type }) => {
  const [queryStates, setQueryStates] = useQueryStates({
    type: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epci: parseAsString.withDefault(''),
    source: parseAsString.withDefault('rp'),
  })

  const SOURCE_OPTIONS = [
    { label: 'RP (INSEE)', value: 'rp' },
    // todo : reenable as soon as filocom data is available
    // ...(type === 'residences-secondaires' ? [{ label: 'FILOCOM', value: 'filocom' }] : []),
    ...(type === 'logements-vacants' ? [{ label: 'Fichiers Fonciers', value: 'lovac' }] : []),
  ]
  const { classes } = useStyles()

  const epcisLinearChart = Object.keys(chartData.linearChart).filter((epci) => queryStates.epcis.includes(epci))
  const linearDataKey = type === 'residences-secondaires' ? 'secondaryAccommodation' : 'vacant'
  const epciName = chartData.tableData[queryStates.epci as string]?.name
  const barChartData = Object.entries(chartData.tableData)
    .filter(([key]) => queryStates.epcis.includes(key))
    .map(([key, value]) => {
      return {
        '2010-2015': value.annualEvolution?.['2010-2015']?.value ?? 0,
        '2015-2021': value.annualEvolution?.['2015-2021']?.value ?? 0,
        epciCode: key,
        name: value.name,
      }
    })

  const title = type && DATA_TYPE_OPTIONS.find((option) => option.value === queryStates.type)?.label
  const barChartTitle =
    type === 'residences-secondaires'
      ? 'Évolution annuelle moyenne du nombre de résidences secondaires'
      : 'Évolution annuelle moyenne du nombre de logements vacants'
  const lineChartTitle =
    type === 'residences-secondaires'
      ? 'Évolution du nombre de résidences secondaires en volume'
      : 'Évolution du nombre de logements vacants en volume'

  // Custom tooltip for LineChart
  const customLineTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className={classes.tooltip}>
          <p className={classes.tooltipTitle}>Année {label}</p>
          {payload.map((entry) => (
            <div key={entry.dataKey} className={classes.tooltipRow}>
              <span
                className={classes.tooltipColorBox}
                style={{ backgroundColor: getChartColor(entry.dataKey as Parameters<typeof getChartColor>[0]) }}
              />
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

  // Custom tooltip for BarChart
  const customBarTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className={classes.tooltip}>
          <p className={classes.tooltipTitle}>{label}</p>
          {payload.map((entry) => (
            <div key={entry.dataKey} className={classes.tooltipRow}>
              <span
                className={classes.tooltipColorBox}
                style={{ backgroundColor: getChartColor(entry.dataKey as Parameters<typeof getChartColor>[0]) }}
              />
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

  const customLineLegend = () => {
    const legendItems = epcisLinearChart.map((epci) => ({
      name: chartData.linearChart[epci].epci.name,
      color: getChartColor(linearDataKey),
    }))

    return (
      <div className={classes.legend}>
        {legendItems.map((entry, index) => (
          <div key={index} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: entry.color }} />
            <span className={classes.legendLabel}>{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }

  const customBarLegend = () => {
    const legendItems = [
      { dataKey: '2010-2015', name: '2010-2015', color: getChartColor('2010-2015') },
      { dataKey: '2015-2021', name: '2015-2021', color: getChartColor('2015-2021') },
    ]

    return (
      <div className={classes.legend}>
        {legendItems.map((entry) => (
          <div key={entry.dataKey} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: entry.color }} />
            <span className={classes.legendLabel}>{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className={styles.headerContainer}>
        <h2 className={fr.cx('fr-h5')}>
          {title} - {epciName}
        </h2>
        <Select
          label=""
          nativeSelectProps={{
            onChange: (event) => setQueryStates({ source: event.target.value }),
            value: queryStates.source || '',
          }}
        >
          {SOURCE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <div className={classes.chartsContainer}>
        <div className={classes.chartContainer}>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart width={500} height={500} margin={{ left: 20, right: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" type="number" scale="linear" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false}>
                <Label value={lineChartTitle} offset={10} position="bottom" />
              </XAxis>

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
              {epcisLinearChart.map((epci) => {
                const data = chartData.linearChart[epci].data
                return (
                  <Line
                    dataKey={linearDataKey}
                    stroke={getChartColor(linearDataKey)}
                    data={data}
                    name={chartData.linearChart[epci].epci.name}
                    key={epci}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
          {customLineLegend()}
        </div>
        <div className={classes.chartContainer}>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart width={730} height={600} data={barChartData} margin={{ bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" textAnchor="end" interval={0} tick={{ fontSize: 12 }}>
                <Label value={barChartTitle} position="bottom" />
              </XAxis>
              <YAxis />
              <Tooltip content={customBarTooltip} />
              <Bar dataKey="2010-2015" name="2010-2015" fill={getChartColor('2010-2015')} key="2010-2015" />
              <Bar dataKey="2015-2021" name="2015-2021" fill={getChartColor('2015-2021')} key="2015-2021" />
            </BarChart>
          </ResponsiveContainer>
          {customBarLegend()}
        </div>
      </div>
    </>
  )
}

const useStyles = tss.create({
  chartsContainer: {
    display: 'flex',
    gap: '2rem',
    height: '700px',
    width: '100%',
    justifyContent: 'space-between',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    marginTop: '0.5rem',
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
})
