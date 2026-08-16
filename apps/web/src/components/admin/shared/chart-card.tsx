'use client'

import classNames from 'classnames'
import type { FC, ReactElement, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from './admin-classes'

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

const NO_DATA_CLASS = 'fr-flex fr-align-items-center fr-justify-content-center fr-height-full fr-text--sm fr-text-mention--grey'

export const ChartCard: FC<ChartCardProps> = ({ actions, children, hint, isEmpty, isLoading, tall, title }) => (
  <div className={ADMIN_CARD}>
    <div className={ADMIN_CARD_HEADER}>
      <div>
        <h2 className={classNames('fr-m-0', styles.cardTitle)}>{title}</h2>
        {hint && <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">{hint}</p>}
      </div>
      {actions}
    </div>
    <div className={classNames('fr-px-5v fr-py-4v', tall ? styles.chartContainerTall : styles.chartContainer)}>
      {isLoading ? (
        <div className={NO_DATA_CLASS}>Chargement…</div>
      ) : isEmpty ? (
        <div className={NO_DATA_CLASS}>Aucune donnée sur cette période</div>
      ) : (
        <ResponsiveContainer height="100%" width="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  </div>
)
