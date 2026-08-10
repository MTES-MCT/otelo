'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { ComponentProps, FC, useState } from 'react'
import { Bar, ComposedChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dsfrHighlightColors, dsfrRealColors, getChartColor } from '~/components/charts/data-visualisation/colors'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { TFlowRequirementChartData, TSitadelData } from '~/schemas/results'
import styles from './synthesis-cn-evolution-chart.module.css'

interface EpciFlowData {
  code: string
  name: string
  flowData: TFlowRequirementChartData
}

interface SynthesisCnEvolutionChartProps {
  epcisFlowData: EpciFlowData[]
  horizon: number
  sitadelEpcis: TSitadelData[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
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

export const SynthesisCnEvolutionChart: FC<SynthesisCnEvolutionChartProps> = ({ epcisFlowData, horizon, sitadelEpcis }) => {
  const [showDetail, setShowDetail] = useQueryState('details', parseAsBoolean.withDefault(false))
  const [showAuthorizedHousing, setShowAuthorizedHousing] = useState(true)
  const [showStartedHousing, setShowStartedHousing] = useState(true)

  // Aggregate Sitadel data across all EPCIs by year
  const aggregatedSitadel = sitadelEpcis
    .flatMap((epci) => epci.data)
    .reduce<Record<number, { authorizedHousing: number; startedHousing: number }>>((acc, entry) => {
      if (!acc[entry.year]) acc[entry.year] = { authorizedHousing: 0, startedHousing: 0 }
      acc[entry.year].authorizedHousing += entry.authorizedHousingCount
      acc[entry.year].startedHousing += entry.startedHousingCount
      return acc
    }, {})

  // Collect all years across all EPCIs and Sitadel
  const allYears = Array.from(
    new Set([
      ...epcisFlowData.flatMap((epci) => Object.keys(epci.flowData.data.housingNeeds).map(Number)),
      ...Object.keys(aggregatedSitadel).map(Number),
    ]),
  ).sort((a, b) => a - b)

  // Build merged data: one entry per year with a key per EPCI + total + Sitadel
  const mergedData = allYears.map((year) => {
    const entry: Record<string, number | null> = { year }
    let total = 0
    epcisFlowData.forEach((epci) => {
      const val = epci.flowData.data.housingNeeds[year] ?? 0
      entry[epci.code] = val
      total += Math.max(val, 0)
    })
    entry.total = total
    entry.authorizedHousing = aggregatedSitadel[year]?.authorizedHousing ?? null
    entry.startedHousing = aggregatedSitadel[year]?.startedHousing ?? null
    return entry
  })

  // Compute max value for Y axis (including visible Sitadel series)
  const sitadelValues = [
    ...(showAuthorizedHousing ? Object.values(aggregatedSitadel).map((d) => d.authorizedHousing) : []),
    ...(showStartedHousing ? Object.values(aggregatedSitadel).map((d) => d.startedHousing) : []),
  ]
  const needsMax = showDetail
    ? Math.max(
        ...allYears.map((year) => epcisFlowData.reduce((sum, epci) => sum + Math.max(epci.flowData.data.housingNeeds[year] ?? 0, 0), 0)),
        0,
      )
    : Math.max(...mergedData.map((d) => d.total ?? 0), 0)
  const maxValue = Math.max(needsMax, ...sitadelValues, 0)

  // Filter out Sitadel colors from EPCI palette to avoid confusion
  const sitadelColors = new Set([getChartColor('authorizedHousing'), getChartColor('startedHousing')])
  const epciColors = dsfrHighlightColors.filter((color) => !sitadelColors.has(color))

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
    <div className="fr-background-default--grey shadow" id="demographie-parc" {...tutorialAnchor('results-synthesis-chart')}>
      <div className="fr-py-8w fr-px-5w">
        <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
          <h3 className="fr-h4 fr-mb-0">Besoins en construction neuve annualisés</h3>
          <button type="button" className="fr-link fr-text--sm" onClick={() => setShowDetail(!showDetail)}>
            {showDetail ? 'Masquer le détail par EPCI' : 'Voir le détail par EPCI'}
          </button>
        </div>
        <p className="fr-text--sm fr-text-mention--grey fr-mt-1w">
          {showDetail
            ? "Ce graphique présente l'évolution des besoins annuels en construction neuve pour chaque EPCI du territoire, en les comparant avec les permis de construire autorisés et les logements commencés sur les années récentes. Les barres verticales indiquent l'année du pic de besoins pour chaque EPCI."
            : "Ce graphique présente l'évolution des besoins annuels en construction neuve sur le territoire, en les comparant avec les permis de construire autorisés et les logements commencés sur les années récentes."}
        </p>
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
                stroke={dsfrRealColors.blueFranceSun}
                strokeDasharray="5 5"
                label={{
                  value: 'Horizon de projection',
                  position: 'top',
                  fill: dsfrRealColors.blueFranceSun,
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

              {showDetail ? (
                <>
                  {epcisFlowData.map((epci, index) => (
                    <Bar
                      key={epci.code}
                      name={epci.name}
                      dataKey={epci.code}
                      stackId="cn"
                      fill={epciColors[index % epciColors.length]}
                      barSize={8}
                    />
                  ))}

                  {(() => {
                    const peaksByYear = epcisFlowData.reduce<Record<number, string[]>>((acc, epci) => {
                      const year = epci.flowData.data.peakYear
                      if (!acc[year]) acc[year] = []
                      acc[year].push(epci.name)
                      return acc
                    }, {})

                    return Object.entries(peaksByYear).map(([year, names]) => (
                      <ReferenceLine
                        key={`peak-${year}`}
                        x={Number(year)}
                        strokeDasharray="3 3"
                        label={{
                          value: `Pic : ${names.join(', ')}`,
                          position: 'insideTopRight',
                          fontSize: 10,
                          angle: -90,
                        }}
                      />
                    ))
                  })()}
                </>
              ) : (
                <Bar name="Besoins en logements" dataKey="total" fill={getChartColor('housingNeeds')} barSize={8} />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
