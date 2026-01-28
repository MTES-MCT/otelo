import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/Select'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { Bar, BarChart, CartesianGrid, Label, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartColor } from '~/components/charts/data-visualisation/colors'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { TAccommodationLovacEvolution } from '~/schemas/accommodation-evolution'
import headerStyles from './accommodation-evolution-charts.module.css'
import styles from './lovac-evolution-charts.module.css'

export type LovacAccommodationEvolutionChart = {
  data: TAccommodationLovacEvolution
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
  payload?: Record<string, unknown>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
}

const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipYear}>{label}</p>
      <ul className={styles.tooltipList}>
        {payload.map((entry, index) => (
          <li key={index} className={styles.tooltipItem}>
            <span className={styles.tooltipColorBox} style={{ backgroundColor: entry.color }} />
            <span className={styles.tooltipLabel}>{entry.name}</span>
            <span className={styles.tooltipValue}>{entry.value?.toLocaleString('fr-FR') ?? '-'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface LegendPayloadItem {
  value: string
  color: string
  dataKey: string
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[]
}

const CustomLegend: FC<CustomLegendProps> = ({ payload }) => {
  if (!payload) return null

  return (
    <div className={styles.legend}>
      {payload.map((entry, index) => (
        <div key={index} className={styles.legendItem}>
          <span className={styles.legendColorBox} style={{ backgroundColor: entry.color }} />
          <span className={styles.legendLabel}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const LovacAccommodationEvolutionChart: FC<LovacAccommodationEvolutionChart> = ({ data: chartData }) => {
  const [queryStates, setQueryStates] = useQueryStates({
    type: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    source: parseAsString.withDefault('rp'),
  })
  const SOURCE_OPTIONS = [
    { label: 'RP (INSEE)', value: 'rp' },
    { label: 'Fichiers Fonciers', value: 'lovac' },
  ]

  const epcisLinearChart = Object.keys(chartData.linearChart).filter((epci) => queryStates.epcis.includes(epci))
  const epciName = chartData.tableData[queryStates.epcis[0] as string]?.name
  const barChartData = Object.entries(chartData.tableData)
    .filter(([key]) => queryStates.epcis.includes(key))
    .map(([_, value]) => {
      return [
        {
          nbLogVac2Less: value.annualEvolution?.['2014-2019']?.nbLogVac2Less?.value ?? 0,
          nbLogVac2More: value.annualEvolution?.['2014-2019']?.nbLogVac2More?.value ?? 0,
          period: '2014-2019',
          name: value.name,
        },
        {
          nbLogVac2Less: value.annualEvolution?.['2019-2024']?.nbLogVac2Less?.value ?? 0,
          nbLogVac2More: value.annualEvolution?.['2019-2024']?.nbLogVac2More?.value ?? 0,
          period: '2019-2024',
          name: value.name,
        },
      ]
    })
    .flat()
    .sort((a, b) => a.period.localeCompare(b.period))

  const title = DATA_TYPE_OPTIONS.find((option) => option.value === queryStates.type)?.label

  const epciColorPairs: [string, string][] = [
    ['#2563eb', '#60a5fa'],
    ['#16a34a', '#4ade80'],
    ['#b91c1c', '#f87171'],
    ['#a21caf', '#e879f9'],
    ['#ca8a04', '#fde047'],
    ['#0e7490', '#67e8f9'],
    ['#be185d', '#f472b6'],
    ['#7c3aed', '#c4b5fd'],
    ['#ea580c', '#fdba74'],
    ['#15803d', '#bbf7d0'],
  ]

  return (
    <>
      <div className={headerStyles.headerContainer}>
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
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            width={500}
            height={500}
            margin={{ left: 20, right: 20, bottom: 30 }}
            data={(() => {
              // Merge all selected EPCI data by year, with each EPCI's values as separate keys
              const years = [2014, 2019, 2024]
              return years.map((year) => {
                const entry: { year: number; [key: string]: number } = { year }
                epcisLinearChart.forEach((epci) => {
                  const epciRawData = chartData.linearChart[epci].data as Array<{
                    nbLogVac2Less: number
                    nbLogVac2More: number
                    nbTotal: number
                    propLogVac2Less: number
                    propLogVac2More: number
                  }>
                  const yearsList = [2014, 2019, 2024]
                  const epciDataWithYear = epciRawData.map((d, i) => ({ ...d, year: yearsList[i] }))
                  const epciData = epciDataWithYear.find((d) => d.year === year)
                  entry[`${epci}-nbLogVac2Less`] = epciData?.nbLogVac2Less ?? 0
                  entry[`${epci}-nbLogVac2More`] = epciData?.nbLogVac2More ?? 0
                })
                return entry
              })
            })()}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" ticks={[2014, 2019, 2024]}>
              <Label value="Nombre de logements vacants par durée de vacance" offset={-10} position="insideBottom" />
            </XAxis>
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {epcisLinearChart.map((epci, index) => [
              <Bar
                key={`${epci}-nbLogVac2Less`}
                dataKey={`${epci}-nbLogVac2Less`}
                stackId={epci}
                fill={epciColorPairs[index % epciColorPairs.length][0]}
                name={`${chartData.linearChart[epci].epci.name} < 2 ans`}
              />,
              <Bar
                key={`${epci}-nbLogVac2More`}
                dataKey={`${epci}-nbLogVac2More`}
                stackId={epci}
                fill={epciColorPairs[index % epciColorPairs.length][1]}
                name={`${chartData.linearChart[epci].epci.name} > 2 ans`}
              />,
            ])}
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart width={730} height={600} data={barChartData} margin={{ left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <Legend content={<CustomLegend />} />
            <XAxis dataKey="period" ticks={['2014-2019', '2019-2024']}>
              <Label value="Évolution annuelle moyenne du nombre de logements vacants" offset={-10} position="insideBottom" />
            </XAxis>
            <YAxis
              domain={(() => {
                const minNbLogVac2Less = Math.min(...barChartData.map((d) => d.nbLogVac2Less))
                const minNbLogVac2More = Math.min(...barChartData.map((d) => d.nbLogVac2More))
                const maxNbLogVac2Less = Math.max(...barChartData.map((d) => d.nbLogVac2Less))
                const maxNbLogVac2More = Math.max(...barChartData.map((d) => d.nbLogVac2More))
                const globalMin = Math.min(minNbLogVac2Less, minNbLogVac2More)
                const globalMax = Math.max(maxNbLogVac2Less, maxNbLogVac2More)
                const padding = (globalMax - globalMin) * 0.05
                const min = globalMin === 0 ? 0 : Math.max(0, Math.round(globalMin - padding))
                const max = Math.round(globalMax + padding)
                return [min, max]
              })()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nbLogVac2Less" name="Logements vacants < 2 ans" fill={getChartColor('nbLogVac2Less')} key="nbLogVac2Less" />
            <Bar dataKey="nbLogVac2More" name="Logements vacants longue durée" fill={getChartColor('nbLogVac2More')} key="nbLogVac2More" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
