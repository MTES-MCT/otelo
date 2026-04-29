import classNames from 'classnames'
import type { EvolutionDirection, RateEvolution } from '~/app/(authenticated)/tableaux-de-bord/comparison-data'
import styles from './evolution-badge.module.css'

interface EvolutionBadgeProps {
  evolution: RateEvolution
  direction?: EvolutionDirection
}

export function EvolutionBadge({ evolution, direction }: EvolutionBadgeProps) {
  const tone = getTone(evolution.points, direction)
  return (
    <span className={classNames(styles.badge, styles[tone])} title="Écart avec le taux brut du millésime">
      {evolution.label}
    </span>
  )
}

function getTone(points: number, direction?: EvolutionDirection): 'neutral' | 'success' | 'error' {
  if (points === 0 || !direction) return 'neutral'
  const isImprovement = direction === 'lower-is-better' ? points < 0 : points > 0
  return isImprovement ? 'success' : 'error'
}
