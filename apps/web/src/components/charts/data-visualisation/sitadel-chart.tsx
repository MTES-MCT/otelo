'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import type { TooltipContentProps } from 'recharts'
import { Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tss } from 'tss-react'
import { DATA_TYPE_OPTIONS } from '~/components/data-visualisation/select-data-type'
import { TSitadel } from '~/schemas/sitadel'
import { formatNumber } from '~/utils/format-numbers'
import styles from './accommodation-evolution-charts.module.css'
import { getChartColor } from './colors'

interface SitadelChartProps {
  data: TSitadel
}

export const SitadelChart: FC<SitadelChartProps> = ({ data }) => {
  const [queryStates, setQueryStates] = useQueryStates({
    type: parseAsString,
    epci: parseAsString,
  })
  const { classes } = useStyles()

  const selectedEpciData = data[queryStates.epci as string]

  // Transform data to show each year with its housing counts
  const chartData = selectedEpciData.data.map((item) => ({
    year: item.year,
    authorizedHousing: item.authorizedHousingCount,
    startedHousing: item.startedHousingCount,
  }))

  const title = DATA_TYPE_OPTIONS.find((option) => option.value === queryStates.type)?.label
  const EPCIS_OPTIONS = Object.entries(data).map(([key, value]) => ({ label: value.name, value: key }))
  const name = selectedEpciData.name
  const chartTitle = `Données SITADEL - ${name}`

  const maxValue = Math.max(...chartData.map((d) => Math.max(d.authorizedHousing, d.startedHousing)))

  const legendOrder = [
    { dataKey: 'authorizedHousing', name: 'Permis de construire autorisés', color: getChartColor('authorizedHousing') },
    { dataKey: 'startedHousing', name: 'Logements commencés', color: getChartColor('startedHousing') },
  ]

  const customLegend = () => {
    return (
      <div className={classes.legend}>
        {legendOrder.map((entry) => (
          <div key={entry.dataKey} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: entry.color }} />
            <span className={classes.legendLabel}>{entry.name}</span>
          </div>
        ))}
      </div>
    )
  }

  const customTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className={classes.tooltip}>
          <p className={classes.tooltipTitle}>{label}</p>
          {legendOrder.map((entry) => {
            const payloadItem = payload.find((p) => p.dataKey === entry.dataKey)
            if (payloadItem && payloadItem.value && payloadItem.value > 0) {
              return (
                <div key={entry.dataKey} className={classes.tooltipRow}>
                  <span className={classes.tooltipColorBox} style={{ backgroundColor: entry.color }} />
                  <span className={classes.tooltipLabel}>
                    {entry.name}: <strong>{formatNumber(payloadItem.value)}</strong>
                  </span>
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  const chartDescription = (
    <>
      <p>
        <span className="fr-text--bold">Clé de lecture :</span> Ce graphique présente les données SITADEL pour le territoire de {name},
        montrant les permis de construire autorisés et les logements commencés.
      </p>
      <p className="fr-mb-0">
        <span className="fr-text--bold">Total permis de construire autorisés</span> :{' '}
        {formatNumber(chartData.reduce((sum, d) => sum + d.authorizedHousing, 0))}
      </p>
      <p>
        <span className="fr-text--bold">Total logements commencés</span> :{' '}
        {formatNumber(chartData.reduce((sum, d) => sum + d.startedHousing, 0))}
      </p>
    </>
  )

  return (
    <>
      <div className={styles.headerContainer}>
        <h2 className={fr.cx('fr-h5')}>
          {title} - {name}
        </h2>
        <div>
          <Select
            label=""
            nativeSelectProps={{
              onChange: (event) => setQueryStates({ epci: event.target.value }),
              value: queryStates.epci || '',
            }}
          >
            {EPCIS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className={classes.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            width={500}
            height={300}
            data={chartData}
            margin={{
              bottom: 5,
              right: 50,
              top: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <Bar name="Permis de construire autorisés" dataKey="authorizedHousing" fill={getChartColor('authorizedHousing')} />
            <Bar name="Logements commencés" dataKey="startedHousing" fill={getChartColor('startedHousing')} />
            <XAxis dataKey="year" />
            <Tooltip content={customTooltip} />
            <Legend content={customLegend} />
            <YAxis domain={[0, maxValue]} allowDecimals={false} includeHidden={true} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className={classes.titleContainer}>
          <span className={classes.title}>{chartTitle}</span>
        </div>
      </div>
      <div>{chartDescription}</div>
    </>
  )
}

const useStyles = tss.create({
  chartContainer: {
    height: '600px',
    marginBottom: '2rem',
    paddingLeft: '2rem',
    paddingTop: '2rem',
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1rem',
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
