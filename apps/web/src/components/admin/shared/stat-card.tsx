import classNames from 'classnames'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'

export type StatCardAccent = 'blue' | 'green' | 'orange' | 'purple'

const ACCENT_CLASSES: Record<StatCardAccent, string> = {
  blue: styles.statCardBlue,
  green: styles.statCardGreen,
  orange: styles.statCardOrange,
  purple: styles.statCardPurple,
}

type StatCardProps = {
  label: string
  value: string | number
  /** Précision affichée sous la valeur : période couverte, dénominateur, mise en garde. */
  hint?: string
  /** Classe d'icône DSFR, affichée en filigrane. */
  icon?: string
  accent?: StatCardAccent
  isLoading?: boolean
}

export const StatCard: FC<StatCardProps> = ({ accent = 'blue', hint, icon, isLoading, label, value }) => (
  <div className={classNames('fr-p-5v fr-border fr-border-radius--8 fr-background-default--grey', styles.statCard, ACCENT_CLASSES[accent])}>
    <div className={classNames('fr-text--xs fr-text--uppercase fr-text-mention--grey', styles.statLabel)}>{label}</div>
    <div className={classNames('fr-mt-1v fr-text--bold fr-line-height-1', styles.statValue)}>
      {isLoading ? '—' : typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
    </div>
    {hint && <div className="fr-mt-1v fr-text--xs fr-text-mention--grey">{hint}</div>}
    {icon && <span className={classNames(icon, 'fr-icon--lg', styles.statIcon)} aria-hidden="true" />}
  </div>
)
