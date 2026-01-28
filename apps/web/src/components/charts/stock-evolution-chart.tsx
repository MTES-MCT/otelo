'use client'

import { FC, ReactNode, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { tss } from 'tss-react'
import { getChartColor } from '~/components/charts/data-visualisation/colors'

const COLORS = [
  getChartColor('hosted'),
  getChartColor('noAccommodation'),
  getChartColor('financialInadequation'),
  getChartColor('physicalInadequation'),
  getChartColor('badQuality'),
]

interface ChartDataItem {
  name: string
  value: number
  color: string
  description: (value: string) => ReactNode
}

const formatNumber = (value: number): string => {
  return Math.abs(value).toLocaleString('fr-FR')
}

export const StockEvolutionChart: FC<{
  horizon: number
  chartData: {
    name: string
    value: number
  }[]
}> = ({ horizon, chartData }) => {
  const { classes } = useStyles()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  const enrichedData: ChartDataItem[] = chartData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    description: getDescriptionForDataItem(item.name),
  }))

  const centerContent =
    activeIndex !== null && enrichedData[activeIndex] ? (
      <div className={classes.tooltipContent}>
        <div className={classes.tooltipHeader}>
          <span className={classes.tooltipColorBox} style={{ backgroundColor: enrichedData[activeIndex].color }} />
          <span className={classes.tooltipTitle}>{enrichedData[activeIndex].name}</span>
        </div>
        <p className={classes.tooltipDescription}>{enrichedData[activeIndex].description(formatNumber(enrichedData[activeIndex].value))}</p>
      </div>
    ) : (
      <div className={classes.defaultTitle}>Les situations de mal logement à résoudre en {horizon}</div>
    )

  return (
    <div className={classes.chartWithLegend}>
      <div className={classes.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enrichedData}
              cx="50%"
              cy="50%"
              innerRadius={155}
              outerRadius={185}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              stroke="none"
            >
              {enrichedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                  style={{
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
            {activeIndex !== null && activeIndex >= 0 && activeIndex < enrichedData.length && (
              <Pie
                data={[enrichedData[activeIndex]]}
                cx="50%"
                cy="50%"
                innerRadius={152}
                outerRadius={188}
                dataKey="value"
                stroke="none"
                startAngle={enrichedData
                  .slice(0, activeIndex)
                  .reduce((acc, item) => acc + (item.value / enrichedData.reduce((sum, d) => sum + d.value, 0)) * 360, 0)}
                endAngle={enrichedData
                  .slice(0, activeIndex + 1)
                  .reduce((acc, item) => acc + (item.value / enrichedData.reduce((sum, d) => sum + d.value, 0)) * 360, 0)}
                isAnimationActive={false}
              >
                <Cell fill={enrichedData[activeIndex].color} stroke="none" style={{ pointerEvents: 'none' }} />
              </Pie>
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className={classes.centerContent}>{centerContent}</div>
      </div>
      <div className={classes.legend}>
        {enrichedData.map((item, index) => (
          <div key={index} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: item.color }} />
            <span className={classes.legendLabel}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to get descriptions for each data item
function getDescriptionForDataItem(name: string): (value: string) => ReactNode {
  const descriptions: Record<string, (value: string) => ReactNode> = {
    Hébergés: (val: string) => (
      <>
        Les ménages hébergés représentent un besoin de <strong>{val} logements</strong> pour leur permettre d'accéder à un logement
        autonome.
      </>
    ),
    'Hors logement': (val: string) => (
      <>
        Les ménages hors logement nécessitent <strong>{val} logements</strong> pour leur assurer un toit.
      </>
    ),
    'Inadéquation financière': (val: string) => (
      <>
        L'inadéquation financière représente un besoin de <strong>{val} logements</strong> adaptés aux ressources des ménages.
      </>
    ),
    'Inadéquation physique': (val: string) => (
      <>
        L'inadéquation physique nécessite <strong>{val} logements</strong> mieux adaptés aux besoins des ménages.
      </>
    ),
    'Mauvaise qualité': (val: string) => (
      <>
        Les logements de mauvaise qualité représentent un besoin de <strong>{val} logements</strong> de meilleure qualité.
      </>
    ),
  }

  return descriptions[name] || ((val: string) => <>{val} logements nécessaires</>)
}

const useStyles = tss.create({
  chartContainer: {
    display: 'flex',
    height: '500px',
    width: '100%',
  },
  chartWithLegend: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
    width: '400px',
    height: '400px',
  },
  centerContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    width: '70%',
    pointerEvents: 'none',
  },
  defaultTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#161616',
    whiteSpace: 'pre-line',
    lineHeight: 1.4,
  },
  tooltipContent: {
    padding: '0.5rem',
    textAlign: 'center',
  },
  tooltipHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  tooltipColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
    marginTop: '3px',
  },
  tooltipTitle: {
    fontWeight: 700,
    fontSize: '16px',
    color: '#161616',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipDescription: {
    fontSize: '14px',
    color: '#3a3a3a',
    lineHeight: 1.5,
    margin: 0,
    textAlign: 'center',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    maxWidth: '400px',
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
  },
})
