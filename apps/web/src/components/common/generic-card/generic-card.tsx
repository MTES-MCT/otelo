'use client'

import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import { FC, ReactNode } from 'react'
import styles from './generic-card.module.css'

// Generic card component for reusable card UI
export type GenericCardProps = {
  title?: string | ReactNode
  subtitle?: string
  description?: ReactNode
  onClick?: () => void
  className?: string
  header?: ReactNode
  headerAction?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  selected?: boolean
}

export const GenericCard: FC<GenericCardProps> = ({
  title,
  subtitle,
  description,
  onClick,
  className,
  header,
  headerAction,
  footer,
  children,
  selected = false,
}) => {
  const content = children || (
    <>
      <div className={styles.cardUpperBody}>
        {(header || headerAction) && (
          <div className={styles.cardHeader}>
            {header}
            {headerAction}
          </div>
        )}
        {title && <h3 className={styles.cardTitle}>{typeof title === 'string' ? title : title}</h3>}
        {subtitle && <p className={fr.cx('fr-card__desc', 'fr-text--sm', 'fr-mb-1w')}>{subtitle}</p>}
        {description && <div>{description}</div>}
      </div>
      {footer && footer}
    </>
  )

  return (
    <div
      className={classNames(styles.card, { [styles.cardSelected]: selected }, className)}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {content}
    </div>
  )
}
