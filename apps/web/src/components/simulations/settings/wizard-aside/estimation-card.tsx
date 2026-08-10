import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import { FC } from 'react'
import { EstimationBreakdown } from '~/utils/estimation-breakdown'
import { formatNumber } from '~/utils/format-numbers'
import { sPluriel } from '~/utils/sPluriel'
import styles from './wizard-aside.module.css'

type EstimationCardProps = {
  breakdown: EstimationBreakdown
  projection: number | null
  /** Un recalcul est en cours : on garde la dernière valeur connue, en la grisant. */
  isStale: boolean
}

type DeductionRowProps = {
  label: string
  /** Valeur négative ou nulle, telle que renvoyée par le calcul. */
  value: number
}

const DeductionRow: FC<DeductionRowProps> = ({ label, value }) => {
  const isZero = value === 0
  return (
    <li className={classNames(styles.row, isZero ? styles.zeroDeduction : styles.deduction, fr.cx('fr-text--xs'))}>
      <span>{label}</span>
      <span className={fr.cx('fr-text--bold')}>− {formatNumber(Math.abs(Math.round(value)))}</span>
    </li>
  )
}

export const EstimationCard: FC<EstimationCardProps> = ({ breakdown, projection, isStale }) => {
  const netNeed = Math.round(breakdown.netNeed)

  return (
    <div className={classNames(styles.card, 'shadow', { [styles.stale]: isStale })} aria-busy={isStale}>
      <p className={classNames(styles.cardTitle, fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-1w'))}>Votre estimation en cours</p>

      <p className={classNames(styles.headline, fr.cx('fr-h4', 'fr-mb-0'))}>{formatNumber(netNeed)}</p>
      <p className={fr.cx('fr-text--xs', 'fr-mb-0')}>
        logement{sPluriel(netNeed)} neuf{sPluriel(netNeed)} à construire{projection ? ` d'ici ${projection}` : ''}
      </p>

      <hr className={fr.cx('fr-mt-2w', 'fr-pb-1w')} />

      <ul className={styles.questionList}>
        <li className={classNames(styles.row, fr.cx('fr-text--xs'))}>
          <span>Besoin total</span>
          <span className={fr.cx('fr-text--bold')}>{formatNumber(Math.round(breakdown.grossNeed))}</span>
        </li>
        <DeductionRow label="Vacance remobilisée" value={breakdown.vacancy} />
        <DeductionRow label="Résidences secondaires" value={breakdown.secondary} />
        <DeductionRow label="Restructuration" value={breakdown.renewal} />
      </ul>

      <hr className={fr.cx('fr-mt-2w', 'fr-pb-1w')} />

      <p className={classNames(styles.cardTitle, fr.cx('fr-text--xs', 'fr-mb-0'))}>Mis à jour à chaque paramètre modifié</p>
    </div>
  )
}
