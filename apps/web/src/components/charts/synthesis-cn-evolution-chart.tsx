'use client'

import { parseAsBoolean, useQueryState } from 'nuqs'
import { FC } from 'react'
import { Bar, ComposedChart, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dsfrHighlightColors, dsfrRealColors, getChartColor } from '~/components/charts/data-visualisation/colors'
import { TFlowRequirementChartData } from '~/schemas/results'
import styles from './synthesis-cn-evolution-chart.module.css'

interface EpciFlowData {
  code: string
  name: string
  flowData: TFlowRequirementChartData
}

interface SynthesisCnEvolutionChartProps {
  epcisFlowData: EpciFlowData[]
  horizon: number
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

export const SynthesisCnEvolutionChart: FC<SynthesisCnEvolutionChartProps> = ({ epcisFlowData, horizon }) => {
  const [showDetail, setShowDetail] = useQueryState('details', parseAsBoolean.withDefault(false))

  // Collect all years across all EPCIs
  const allYears = Array.from(new Set(epcisFlowData.flatMap((epci) => Object.keys(epci.flowData.data.housingNeeds).map(Number)))).sort(
    (a, b) => a - b,
  )

  // Build merged data: one entry per year with a key per EPCI + total
  const mergedData = allYears.map((year) => {
    const entry: Record<string, number | null> = { year }
    let total = 0
    epcisFlowData.forEach((epci) => {
      const val = epci.flowData.data.housingNeeds[year] ?? 0
      entry[epci.code] = val
      total += Math.max(val, 0)
    })
    entry.total = total
    return entry
  })

  // Compute max value for Y axis
  const maxValue = showDetail
    ? Math.max(
        ...allYears.map((year) => epcisFlowData.reduce((sum, epci) => sum + Math.max(epci.flowData.data.housingNeeds[year] ?? 0, 0), 0)),
        0,
      )
    : Math.max(...mergedData.map((d) => d.total ?? 0), 0)

  return (
    <div className="fr-background-default--grey shadow" id="demographie-parc">
      <div className="fr-py-8w fr-px-5w">
        <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
          <h3 className="fr-h4 fr-mb-0">Besoins en construction neuve annualisés</h3>
          <button type="button" className="fr-link fr-text--sm" onClick={() => setShowDetail(!showDetail)}>
            {showDetail ? 'Masquer le détail par EPCI' : 'Voir le détail par EPCI'}
          </button>
        </div>
        <p className="fr-text--sm fr-text-mention--grey fr-mt-1w">
          {showDetail
            ? "Ce graphique présente l'évolution des besoins annuels en construction neuve pour chaque EPCI du territoire. Les barres verticales indiquent l'année du pic de besoins pour chaque EPCI."
            : "Ce graphique présente l'évolution des besoins annuels en construction neuve sur le territoire."}
        </p>
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

              {showDetail ? (
                <>
                  {epcisFlowData.map((epci, index) => (
                    <Bar
                      key={epci.code}
                      name={epci.name}
                      dataKey={epci.code}
                      stackId="cn"
                      fill={dsfrHighlightColors[index % dsfrHighlightColors.length]}
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
