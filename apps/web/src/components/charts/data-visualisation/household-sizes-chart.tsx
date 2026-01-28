import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/Select'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, TooltipProps, XAxis, YAxis } from 'recharts'
import { NameType, Payload as TooltipPayload, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { tss } from 'tss-react'
import { CustomizedDot } from '~/components/charts/customized-dot'
import { getChartColor } from '~/components/charts/data-visualisation/colors'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { THouseholdSizesChart } from '~/schemas/household-sizes'
import { formatNumber } from '~/utils/format-numbers'
import styles from './projection-menages-evolution-charts.module.css'

export const HOUSEHOLD_SIZES_TYPE_OPTIONS = [
  { label: 'Population haute', value: 'haute' },
  { label: 'Population centrale', value: 'central' },
  { label: 'Population basse', value: 'basse' },
]

const SCENARIOS = [
  {
    dataKey: 'phH',
    id: 'haute',
    name: 'Taille ménages - Accélération',
    stroke: getChartColor('phH'),
  },
  {
    dataKey: 'centralH',
    id: 'central',
    name: 'Taille ménages - Accélération',
    stroke: getChartColor('centralH'),
  },
  {
    dataKey: 'pbH',
    id: 'basse',
    name: 'Taille ménages - Accélération',
    stroke: getChartColor('pbH'),
  },
  {
    dataKey: 'centralC',
    id: 'central',
    name: 'Taille ménages - Tendanciel',
    stroke: getChartColor('centralC'),
  },
  {
    dataKey: 'pbC',
    id: 'basse',
    name: 'Taille ménages - Tendanciel',
    stroke: getChartColor('pbC'),
  },
  {
    dataKey: 'pbB',
    id: 'basse',
    name: 'Taille ménages - Décélération',
    stroke: getChartColor('pbB'),
  },
  {
    dataKey: 'centralB',
    id: 'central',
    name: 'Taille ménages - Décélération',
    stroke: getChartColor('centralB'),
  },
  {
    dataKey: 'phB',
    id: 'haute',
    name: 'Taille ménages - Décélération',
    stroke: getChartColor('phB'),
  },
  {
    dataKey: 'phC',
    id: 'haute',
    name: 'Taille ménages - Tendanciel',
    stroke: getChartColor('phC'),
  },
]

export const CustomTooltip = ({
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
              const scenario = SCENARIOS.find((s) => s.dataKey === item.dataKey)
              const label = scenario ? scenario.name : item.dataKey
              const value = typeof item.value === 'number' ? formatNumber(item.value) : '-'
              return (
                <div key={item.dataKey} className={classes.tooltipRow}>
                  <span className={classes.tooltipDot} style={{ backgroundColor: item.stroke }} />
                  <span className={classes.tooltipItemLabel}>
                    {label}: <strong>{value}</strong>
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

export type HouseholdSizesChartProps = {
  data: THouseholdSizesChart
}

export const HouseholdSizesChart: FC<HouseholdSizesChartProps> = ({ data: chartData }) => {
  const [queryStates, setQueryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    epci: parseAsString.withDefault(''),
    populationType: parseAsString.withDefault('haute'),
  })

  const { classes } = useStyles()
  const epcisLinearChart = Object.keys(chartData.linearChart).filter((epci) => queryStates.epcis.includes(epci))
  const epciName = chartData.linearChart[queryStates.epci as string]?.epci.name

  const title = DATA_TYPE_OPTIONS.find((option) => option.value === 'taille-menages')?.label
  const displayedScenarios = SCENARIOS.map((scenario) => ({
    ...scenario,
    stroke: scenario.stroke,
    strokeWidth: 2,
  }))

  return (
    <>
      <div className={styles.headerContainer}>
        <h2 className={fr.cx('fr-h5')}>
          {title} - {epciName}
        </h2>
        <Select
          label=""
          nativeSelectProps={{
            onChange: (event) => setQueryStates({ populationType: event.target.value }),
            value: queryStates.populationType || '',
          }}
        >
          {HOUSEHOLD_SIZES_TYPE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
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
              return displayedScenarios
                .filter((scenario) => scenario.id === queryStates.populationType)
                .map(({ dataKey, stroke, strokeWidth }) => (
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
        <span className={classes.title}>Évolution de la taille moyenne des ménages</span>
        <div className={classes.legend}>
          {displayedScenarios
            .filter((scenario) => scenario.id === queryStates.populationType)
            .map((scenario) => (
              <div key={scenario.dataKey} className={classes.legendItem}>
                <span className={classes.legendColorBox} style={{ backgroundColor: scenario.stroke }} />
                <span className={classes.legendLabel}>{scenario.name}</span>
              </div>
            ))}
        </div>
      </div>
    </>
  )
}

const useStyles = tss.create({
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '700px',
    width: '100%',
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
