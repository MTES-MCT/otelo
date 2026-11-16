import { TARGET_REDUCTION_LABELS, type TPublicStatistics } from '@otelo/shared'
import { formatInteger, plural } from '~/utils/format-statistics'
import styles from '../statistiques.module.css'
import { describeReduction } from './format'

/** Objectifs fixés hors construction neuve : un domaine n'apparaît que si sa médiane est calculable. */
export function TargetReductions({ targetReductions }: { targetReductions: TPublicStatistics['targetReductions'] }) {
  const domains = targetReductions.flatMap((reduction) => (reduction.median === null ? [] : [{ ...reduction, median: reduction.median }]))
  if (domains.length === 0) return null

  return (
    <ul className={styles.reductions}>
      {domains.map((reduction) => (
        <li key={reduction.domain}>
          <div className={styles.figure}>
            <p className={styles.figureLabel}>{TARGET_REDUCTION_LABELS[reduction.domain]}</p>
            <p className={styles.figureDetail}>
              Objectif médian : {describeReduction(reduction.median)} du taux observé, sur {formatInteger(reduction.scenarios)}{' '}
              {plural(reduction.scenarios, 'scénario exporté', 'scénarios exportés')}.
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
