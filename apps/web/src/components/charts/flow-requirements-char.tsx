'use client'

import { FC, ReactNode, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { tss } from 'tss-react'
import { getChartColor } from '~/components/charts/data-visualisation/colors'

interface DonutDataItem {
  name: string
  value: number
  color: string
  description: (value: string) => ReactNode
}

interface FlowRequirementsChartProps {
  results: {
    demographicEvolution: number
    renewalNeeds: number
    secondaryResidenceAccomodationEvolution: number
    totalFlux: number
    vacantAccomodationEvolution: number
    shortTermVacantAccomodation: number
    longTermVacantAccomodation: number
  }
  horizon: number
}

const formatNumber = (value: number): string => {
  return Math.abs(value).toLocaleString('fr-FR')
}

interface DonutChartProps {
  title: string
  data: DonutDataItem[]
  centerContent: ReactNode
  onHover: (index: number | null) => void
  activeIndex: number | null
  legendItems: LegendItem[]
}

const DonutChart: FC<DonutChartProps> = ({ title, data, centerContent, onHover, activeIndex, legendItems }) => {
  const { classes } = useStyles()

  const onPieEnter = (_: unknown, index: number) => {
    onHover(index)
  }

  const onPieLeave = () => {
    onHover(null)
  }

  return (
    <div className={classes.chartWithLegend}>
      <div className={classes.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={155}
              outerRadius={185}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              stroke="none"
            >
              {data.map((entry, index) => (
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
            {activeIndex !== null && activeIndex >= 0 && activeIndex < data.length && (
              <Pie
                data={[data[activeIndex]]}
                cx="50%"
                cy="50%"
                innerRadius={152}
                outerRadius={188}
                dataKey="value"
                stroke="none"
                startAngle={data
                  .slice(0, activeIndex)
                  .reduce((acc, item) => acc + (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 360, 0)}
                endAngle={data
                  .slice(0, activeIndex + 1)
                  .reduce((acc, item) => acc + (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 360, 0)}
                isAnimationActive={false}
              >
                <Cell fill={data[activeIndex].color} stroke="none" style={{ pointerEvents: 'none' }} />
              </Pie>
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className={classes.centerContent}>{centerContent || <div className={classes.defaultTitle}>{title}</div>}</div>
      </div>
      <div className={classes.legend}>
        {legendItems.map((item, index) => (
          <div key={index} className={classes.legendItem}>
            <span className={classes.legendColorBox} style={{ backgroundColor: item.color }} />
            <span className={classes.legendLabel}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface LegendItem {
  name: string
  color: string
}

export const FlowRequirementsChart: FC<FlowRequirementsChartProps> = ({ results, horizon }) => {
  const { classes } = useStyles()
  const [needsActiveIndex, setNeedsActiveIndex] = useState<number | null>(null)
  const [supplyActiveIndex, setSupplyActiveIndex] = useState<number | null>(null)

  const {
    demographicEvolution,
    renewalNeeds,
    secondaryResidenceAccomodationEvolution,
    totalFlux,
    shortTermVacantAccomodation,
    longTermVacantAccomodation,
  } = results

  const needsData: DonutDataItem[] = [
    {
      name: 'Évolution démographique',
      value: Math.max(0, demographicEvolution),
      color: getChartColor('evolutionDemographiqueDonut'),
      description: (val: string) => (
        <>
          L'évolution du nombre de ménages à loger dans le territoire contribuera pour <strong>{val}</strong> au besoin en logements.
        </>
      ),
    },
    {
      name: 'Résidences secondaires',
      value: Math.max(0, secondaryResidenceAccomodationEvolution),
      color: getChartColor('residencesSecondairesDonut'),
      description: (val: string) => (
        <>
          L'augmentation du nombre de résidences secondaires contribuera à hauteur de <strong>{val}</strong> dans les besoins en
          constructions neuves.
        </>
      ),
    },
    {
      name: 'Fluidité du parc',
      value: Math.max(0, shortTermVacantAccomodation),
      color: getChartColor('fluiditeDuParc'),
      description: (val: string) => (
        <>
          Pour garder de la fluidité dans le parc de logement, il sera nécessaire de produire <strong>{val} logements</strong>.
        </>
      ),
    },
  ].filter((item) => item.value > 0)

  const supplyData: DonutDataItem[] = [
    {
      name: 'Remobilisation de logements vacants',
      value: Math.abs(Math.min(0, longTermVacantAccomodation)),
      color: getChartColor('remobilisationVacants'),
      description: (val: string) => (
        <>
          L'hypothèse retenue concernant le taux de vacance entraînera la remise sur le marché de <strong>{val} logements vacants</strong>.
        </>
      ),
    },
    {
      name: 'Renouvellement urbain',
      value: Math.abs(Math.min(0, renewalNeeds)),
      color: getChartColor('renouvellementUrbain'),
      description: (val: string) => (
        <>
          Le renouvellement urbain contribuera à la création de <strong>{val} logements</strong>, les restructurations excédant les
          disparitions de logements.
        </>
      ),
    },
    {
      name: 'Logements supplémentaires à construire',
      value: Math.max(0, totalFlux),
      color: getChartColor('logementsSupplementaires'),
      description: (val: string) => (
        <>
          Pour couvrir le reste des besoins liés à la démographie et à l'évolution du parc, il faudra construire{' '}
          <strong>{val} logements</strong> supplémentaires.
        </>
      ),
    },
  ].filter((item) => item.value > 0)

  const needsLegendItems: LegendItem[] = needsData.map((item) => ({
    name: item.name,
    color: item.color,
  }))

  const supplyLegendItems: LegendItem[] = supplyData.map((item) => ({
    name: item.name,
    color: item.color,
  }))

  const needsCenterContent =
    needsActiveIndex !== null && needsData[needsActiveIndex] ? (
      <div className={classes.tooltipContent}>
        <div className={classes.tooltipHeader}>
          <span className={classes.tooltipColorBox} style={{ backgroundColor: needsData[needsActiveIndex].color }} />
          <span className={classes.tooltipTitle}>{needsData[needsActiveIndex].name}</span>
        </div>
        <p className={classes.tooltipDescription}>
          {needsData[needsActiveIndex].description(formatNumber(needsData[needsActiveIndex].value))}
        </p>
      </div>
    ) : null

  const supplyCenterContent =
    supplyActiveIndex !== null && supplyData[supplyActiveIndex] ? (
      <div className={classes.tooltipContent}>
        <div className={classes.tooltipHeader}>
          <span className={classes.tooltipColorBox} style={{ backgroundColor: supplyData[supplyActiveIndex].color }} />
          <span className={classes.tooltipTitle}>{supplyData[supplyActiveIndex].name}</span>
        </div>
        <p className={classes.tooltipDescription}>
          {supplyData[supplyActiveIndex].description(formatNumber(supplyData[supplyActiveIndex].value))}
        </p>
      </div>
    ) : null

  const needsTitle = `Les besoins en logements\nen ${horizon}`
  const supplyTitle = `L'offre du parc de logement\nen ${horizon}`

  return (
    <div className={classes.container}>
      <div className={classes.chartsRow}>
        <DonutChart
          title={needsTitle}
          data={needsData}
          centerContent={needsCenterContent}
          onHover={setNeedsActiveIndex}
          activeIndex={needsActiveIndex}
          legendItems={needsLegendItems}
        />
        <DonutChart
          title={supplyTitle}
          data={supplyData}
          centerContent={supplyCenterContent}
          onHover={setSupplyActiveIndex}
          activeIndex={supplyActiveIndex}
          legendItems={supplyLegendItems}
        />
      </div>
    </div>
  )
}

const useStyles = tss.create({
  container: {
    width: '100%',
    padding: '1rem 0',
  },
  chartsRow: {
    display: 'flex',
    justifyContent: 'space-evenly',
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
