'use client'

import classNames from 'classnames'
import type { FC, ReactElement, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'

type ChartCardProps = {
  title: string
  /** Précision affichée sous le titre : source, unité, limite de la mesure. */
  hint?: string
  /** Actions alignées à droite du titre. */
  actions?: ReactNode
  /** Vrai quand la série est vide : la carte affiche alors un repli explicite. */
  isEmpty: boolean
  isLoading?: boolean
  tall?: boolean
  children: ReactElement
}

export const ChartCard: FC<ChartCardProps> = ({ actions, children, hint, isEmpty, isLoading, tall, title }) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>
      <div>
        <h2 className={styles.cardTitle}>{title}</h2>
        {hint && <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">{hint}</p>}
      </div>
      {actions}
    </div>
    <div className={classNames(tall ? styles.chartContainerTall : styles.chartContainer)}>
      {isLoading ? (
        <div className={styles.noData}>Chargement…</div>
      ) : isEmpty ? (
        <div className={styles.noData}>Aucune donnée sur cette période</div>
      ) : (
        <ResponsiveContainer height="100%" width="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  </div>
)
