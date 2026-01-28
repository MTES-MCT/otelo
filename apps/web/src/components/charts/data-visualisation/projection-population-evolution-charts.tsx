import { fr } from '@codegouvfr/react-dsfr'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis } from 'recharts'
import { NameType, Payload as TooltipPayload, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { tss } from 'tss-react'
import { CustomizedDot } from '~/components/charts/customized-dot'
import { getChartColor } from '~/components/charts/data-visualisation/colors'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { TDemographicProjectionEvolution } from '~/schemas/population-evolution'
import { formatNumber } from '~/utils/format-numbers'

const SCENARIOS = [
  {
    dataKey: 'haute',
    stroke: getChartColor('haute'),
  },
  {
    dataKey: 'central',
    stroke: getChartColor('central'),
  },
  {
    dataKey: 'basse',
    stroke: getChartColor('basse'),
  },
]

const CustomTooltip = ({
  active,
  label,
  payload,
}: TooltipProps<ValueType, NameType> & { label?: string; payload?: TooltipPayload<ValueType, NameType>[] }) => {
  const { classes } = useStyles()
  if (!active || !payload?.length) return null

  const grouped: Record<string, typeof payload> = {}
  payload.forEach((item: TooltipPayload<ValueType, NameType>) => {
    const epciName = item.name ?? 'Inconnu'
    if (!grouped[epciName]) grouped[epciName] = []
    grouped[epciName].push(item)
  })

  return (
    <div className={classes.tooltipContainer}>
      <p className={classes.tooltipTitle}>{`Année ${label}`}</p>
      {Object.entries(grouped).map(([epciName, items]) => (
        <div key={epciName} className={classes.tooltipGroup}>
          <div className={classes.bold}>{epciName}</div>
          <div className={classes.tooltipList}>
            {items.map((item: TooltipPayload<ValueType, NameType>) => {
              if (!item.dataKey || typeof item.dataKey !== 'string') return null
              const label = item.dataKey.charAt(0).toUpperCase() + item.dataKey.slice(1)
              const value = typeof item.value === 'number' ? formatNumber(item.value) : '-'
              return (
                <div key={item.dataKey} className={classes.tooltipRow}>
                  <span className={classes.tooltipDot} style={{ backgroundColor: item.stroke }} />
                  <span className={classes.tooltipItemLabel}>
                    {label}: <strong>{value}</strong> habitants
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export type ProjectionPopulationEvolutionChartProps = {
  data: TDemographicProjectionEvolution
  type: string | null
}

export const ProjectionPopulationEvolutionChart: FC<ProjectionPopulationEvolutionChartProps> = ({ data: chartData, type }) => {
  const [queryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epci: parseAsString.withDefault(''),
  })
  const { classes } = useStyles()
  const epcisLinearChart = Object.keys(chartData.linearChart).filter((epci) => queryStates.epcis.includes(epci))
  const epciName = chartData.tableData[queryStates.epci]?.name

  const barChartData = Object.entries(chartData.tableData)
    .filter(([key]) => queryStates.epcis.includes(key))
    .map(([_, epciData]) => {
      return [
        {
          basse: epciData.annualEvolution?.['2021-2030']?.basse?.value || 0,
          central: epciData.annualEvolution?.['2021-2030']?.central?.value || 0,
          haute: epciData.annualEvolution?.['2021-2030']?.haute?.value || 0,
          name: epciData.name,
          period: '2021-2030',
        },
        {
          basse: epciData.annualEvolution?.['2030-2040']?.basse?.value || 0,
          central: epciData.annualEvolution?.['2030-2040']?.central?.value || 0,
          haute: epciData.annualEvolution?.['2030-2040']?.haute?.value || 0,
          name: epciData.name,
          period: '2030-2040',
        },
        {
          basse: epciData.annualEvolution?.['2040-2050']?.basse?.value || 0,
          central: epciData.annualEvolution?.['2040-2050']?.central?.value || 0,
          haute: epciData.annualEvolution?.['2040-2050']?.haute?.value || 0,
          name: epciData.name,
          period: '2040-2050',
        },
      ]
    })
    .flat()
    .sort((a, b) => a.period.localeCompare(b.period))

  const title = type && DATA_TYPE_OPTIONS.find((option) => option.value === type)?.label
  const displayedScenarios = SCENARIOS.map((scenario) => ({
    ...scenario,
    stroke: scenario.stroke,
    strokeWidth: 2,
  }))

  return (
    <>
      <h2 className={fr.cx('fr-h5')}>
        {title} - {epciName}
      </h2>
      <div className={classes.chartsContainer}>
        <div className={classes.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart width={500} height={500} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" allowDuplicatedCategory={false} />

              {epcisLinearChart.length > 0 && (
                <YAxis
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
              <Tooltip content={<CustomTooltip />} />
              {epcisLinearChart.map((epci) => {
                const epciData = chartData.linearChart[epci].data
                return displayedScenarios.map(({ dataKey, stroke, strokeWidth }) => (
                  <Line
                    dataKey={dataKey}
                    data={epciData}
                    type="monotone"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    name={chartData.linearChart[epci].epci.name}
                    key={`${epci}-${dataKey}`}
                    dot={(props) => (
                      <CustomizedDot
                        {...props}
                        stroke={stroke}
                        year={props.payload.year}
                        period={undefined}
                        key={`${epci}-${dataKey}-${props.payload.year}`}
                      />
                    )}
                  />
                ))
              })}
            </LineChart>
          </ResponsiveContainer>
          <span className={classes.title}>Évolution du nombre d'habitants par scenario démographique</span>
          <div className={classes.legend}>
            {displayedScenarios.map((scenario) => (
              <div key={scenario.dataKey} className={classes.legendItem}>
                <span className={classes.legendColorBox} style={{ backgroundColor: scenario.stroke }} />
                <span className={classes.legendLabel}>{scenario.dataKey.charAt(0).toUpperCase() + scenario.dataKey.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={classes.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart width={730} height={600} data={barChartData} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" ticks={['2021-2030', '2030-2040', '2040-2050']} />
              <YAxis />
              <Tooltip
                content={(props) => {
                  const { active, payload, label } = props
                  if (active && payload && payload.length) {
                    const epciName = payload[0]?.payload?.name
                    return (
                      <div className={classes.tooltipContainer}>
                        <p className={classes.tooltipTitle}>
                          {epciName} - {label}
                        </p>
                        {payload.map((entry, index) => (
                          <div key={index} className={classes.tooltipRow}>
                            <span className={classes.tooltipColorBox} style={{ backgroundColor: entry.fill }} />
                            <span className={classes.tooltipItemLabel}>
                              {entry.name}: <strong>{formatNumber(Number(entry.value))}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="haute" name="Population haute" fill={getChartColor('haute')} />
              <Bar dataKey="central" name="Population centrale" fill={getChartColor('central')} />
              <Bar dataKey="basse" name="Population basse" fill={getChartColor('basse')} />
            </BarChart>
          </ResponsiveContainer>
          <span className={classes.title}>Évolution décennal du nombre d'habitants, par scenario démographique</span>
          <div className={classes.legend}>
            <div className={classes.legendItem}>
              <span className={classes.legendColorBox} style={{ backgroundColor: getChartColor('haute') }} />
              <span className={classes.legendLabel}>Population haute</span>
            </div>
            <div className={classes.legendItem}>
              <span className={classes.legendColorBox} style={{ backgroundColor: getChartColor('central') }} />
              <span className={classes.legendLabel}>Population centrale</span>
            </div>
            <div className={classes.legendItem}>
              <span className={classes.legendColorBox} style={{ backgroundColor: getChartColor('basse') }} />
              <span className={classes.legendLabel}>Population basse</span>
            </div>
          </div>
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
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '16px',
    fontWeight: 500,
    color: '#161616',
  },
  tooltipContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '0.75rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  tooltipTitle: {
    fontWeight: 700,
    marginBottom: '0.5rem',
    fontSize: '14px',
    color: '#161616',
    margin: '0 0 0.5rem 0',
  },
  tooltipGroup: {
    marginBottom: '0.5rem',
  },
  tooltipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginTop: '0.25rem',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tooltipDot: {
    height: '12px',
    width: '12px',
    flexShrink: 0,
  },
  tooltipColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
  },
  tooltipItemLabel: {
    fontSize: '13px',
    color: '#3a3a3a',
  },
  bold: {
    fontWeight: 700,
    fontSize: '13px',
    color: '#161616',
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
