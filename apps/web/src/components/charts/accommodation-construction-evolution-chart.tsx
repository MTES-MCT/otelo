'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { ComponentProps, FC, useState } from 'react'
import { Bar, ComposedChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dsfrRealColors, getChartColor } from '~/components/charts/data-visualisation/colors'
import { TFlowRequirementChartData, TSitadelData } from '~/schemas/results'
import styles from './accommodation-construction-evolution-chart.module.css'

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
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

interface AccommodationContructionEvolutionChartProps {
  newConstructionsResults: TFlowRequirementChartData
  sitadelResults: TSitadelData
  horizon: number
  epciName: string
}

export const AccommodationContructionEvolutionChart: FC<AccommodationContructionEvolutionChartProps> = ({
  newConstructionsResults,
  sitadelResults,
  horizon,
  epciName,
}) => {
  const { data: sitadelData } = sitadelResults
  const { data: newConstructionsData } = newConstructionsResults
  const [showAuthorizedHousing, setShowAuthorizedHousing] = useState(true)
  const [showStartedHousing, setShowStartedHousing] = useState(true)

  const allYears = Array.from(
    new Set([
      ...sitadelData.map((d) => d.year),
      ...Object.keys(newConstructionsData.housingNeeds).map(Number),
      ...Object.keys(newConstructionsData.surplusHousing).map(Number),
    ]),
  ).sort((a, b) => a - b)

  const mergedData = allYears.map((year) => {
    const sitadelEntry = sitadelData.find((d) => d.year === year)
    return {
      housingNeeds: newConstructionsData.housingNeeds[year] ?? null,
      surplusHousing: newConstructionsData.surplusHousing[year] ?? null,
      authorizedHousing: sitadelEntry?.authorizedHousingCount ?? null,
      startedHousing: sitadelEntry?.startedHousingCount ?? null,
      year,
    }
  })

  const hasHousingNeeds = Object.values(newConstructionsData.housingNeeds).some((value) => value != null && value > 0)
  const hasSurplusHousing = Object.values(newConstructionsData.surplusHousing).some((value) => value != null && value > 0)

  const visibleValues = [
    ...(showAuthorizedHousing ? sitadelData.map((d) => d.authorizedHousingCount) : []),
    ...(showStartedHousing ? sitadelData.map((d) => d.startedHousingCount) : []),
    ...Object.values(newConstructionsData.housingNeeds),
    ...Object.values(newConstructionsData.surplusHousing),
  ].filter((value): value is number => value != null)

  const maxValue = Math.max(...visibleValues, 0)

  const sitadelOptions: ComponentProps<typeof Checkbox>['options'] = [
    {
      label: 'Permis de construire autorisés (Sit@del2)',
      nativeInputProps: {
        checked: showAuthorizedHousing,
        onChange: (event) => setShowAuthorizedHousing(event.target.checked),
      },
    },
    {
      label: 'Logements commencés (Sit@del2)',
      nativeInputProps: {
        checked: showStartedHousing,
        onChange: (event) => setShowStartedHousing(event.target.checked),
      },
    },
  ]

  return (
    <div id="besoin-annualise">
      <h3 className="fr-h4">Besoins en construction neuves annualisés</h3>
      <div className="fr-col-10">
        <p className="fr-mb-0">
          Ce graphique présente l'évolution des besoins annuels en construction neuve sur le territoire de {epciName}, en les comparant avec
          les permis de construire autorisés et les logements commencés sur les années récentes.
        </p>
        <p className="fr-mt-2w fr-text--xs fr-text-mention--grey">Source des données : Sit@del2</p>
      </div>
      <div className={styles.filters}>
        <Checkbox legend="" options={sitadelOptions} orientation="horizontal" />
      </div>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mergedData}>
            <XAxis dataKey="year" />
            <YAxis domain={[0, maxValue]} allowDecimals={false} />

            <ReferenceLine
              x={horizon}
              stroke={dsfrRealColors.blueFrance}
              label={{
                value: 'Horizon de projection',
                position: 'top',
                fill: dsfrRealColors.blueFrance,
                fontSize: 12,
                offset: 10,
              }}
            />
            {showAuthorizedHousing && (
              <Bar
                name="Permis de construire autorisés (Sit@del2)"
                dataKey="authorizedHousing"
                fill={getChartColor('authorizedHousing')}
                barSize={8}
              />
            )}
            {showStartedHousing && (
              <Bar name="Logements commencés (Sit@del2)" dataKey="startedHousing" fill={getChartColor('startedHousing')} barSize={8} />
            )}
            {hasHousingNeeds && (
              <Bar name="Besoins en constructions neuves" dataKey="housingNeeds" fill={getChartColor('housingNeeds')} barSize={8} />
            )}
            {hasSurplusHousing && (
              <Bar name="Logements excédentaires" dataKey="surplusHousing" fill={getChartColor('surplusHousing')} barSize={8} />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend />}
              itemSorter={(item) => {
                const order = ['authorizedHousing', 'startedHousing', 'housingNeeds', 'surplusHousing']
                return order.indexOf(item.dataKey as string)
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
