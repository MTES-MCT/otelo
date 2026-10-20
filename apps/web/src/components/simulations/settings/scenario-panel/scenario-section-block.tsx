'use client'

import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import classNames from 'classnames'
import { FC, ReactNode, useId, useState } from 'react'
import { formatNumber } from '~/utils/format-numbers'
import styles from './scenario-panel.module.css'
import type { ScenarioRow, ScenarioSection } from './scenario-sections'

type ScenarioSectionBlockProps = {
  section: ScenarioSection
  defaultOpen: boolean
  /** Précision affichée sous le libellé d'une ligne, ex. le taux cible. */
  renderRowDetail?: (row: ScenarioRow) => ReactNode
}

const format = (value: number) => formatNumber(Math.round(value))

/** Un bloc repliable de l'estimation : son total en badge, ses lignes dessous. */
export const ScenarioSectionBlock: FC<ScenarioSectionBlockProps> = ({ section, defaultOpen, renderRowDetail }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={classNames(isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line', styles.chevron)} aria-hidden />
        <span className={styles.sectionTitle}>{section.title}</span>
        {section.total !== null && <span className={styles.totalBadge}>{format(section.total)}</span>}
      </button>
      <ul id={contentId} className={styles.rows} hidden={!isOpen}>
        {section.rows.map((row) => {
          const detail = row.value !== null ? renderRowDetail?.(row) : null
          return (
            <li key={row.key} className={classNames(styles.row, { [styles.editing]: row.isEditing })}>
              <span className={styles.rowLabel}>
                {row.label}
                {row.footnote && <sup aria-hidden> *</sup>}
                {row.isEditing && <span className="fr-sr-only"> (en cours de paramétrage)</span>}
                {detail && <span className={styles.rowDetail}>{detail}</span>}
              </span>
              {row.value !== null ? (
                <span className={styles.valueBadge}>{format(row.value)}</span>
              ) : (
                <Tooltip kind="click" title={`Calculé à l'étape « ${row.stepLabel} »`} />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
