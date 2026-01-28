import { NameType, Payload as TooltipPayload, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { tss } from 'tss-react'
import { TPopulationEvolution } from '~/schemas/demographic-evolution'
import { formatNumber } from '~/utils/format-numbers'

export const PopulationScenariosCustomTooltip = ({
  active,
  basePopulation,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: TooltipPayload<ValueType, NameType>[]
  basePopulation: TPopulationEvolution
}) => {
  const { classes } = useStyles()
  if (!active || !payload?.length) return null
  return (
    <div className={classes.tooltip}>
      <p className={classes.tooltipTitle}>{`Année ${label}`}</p>
      {/* biome-ignore lint/suspicious/noExplicitAny: TODO */}
      {payload.map((item: any) => {
        const evol = item.value - basePopulation[item.dataKey as keyof typeof basePopulation]
        return (
          <div key={item.dataKey} className={classes.tooltipRow}>
            <span className={classes.tooltipColorBox} style={{ backgroundColor: item.stroke }} />
            <div className={classes.tooltipContent}>
              <span className={classes.tooltipLabel}>
                {item.name}: <strong>{evol > 0 ? `+${formatNumber(evol)}` : formatNumber(evol)}</strong> habitants par rapport à{' '}
                <strong>2021</strong>
              </span>
              <span className={classes.tooltipSmallText}>({formatNumber(item.value)} habitants)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const useStyles = tss.create({
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
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  tooltipColorBox: {
    width: '12px',
    height: '12px',
    flexShrink: 0,
    marginTop: '4px',
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  tooltipLabel: {
    fontSize: '13px',
    color: '#3a3a3a',
  },
  tooltipSmallText: {
    fontSize: '11px',
    color: '#666',
  },
  // Legacy styles kept for compatibility
  tooltipContainer: {
    backgroundColor: 'white',
    border: '1px solid var(--border-default-grey)',
    borderRadius: '4px',
    padding: '1rem',
  },
  tooltipItem: {
    alignItems: 'center',
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  tooltipDot: {
    borderRadius: '50%',
    height: '8px',
    width: '8px',
  },
  bold: {
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: '10px',
  },
})
