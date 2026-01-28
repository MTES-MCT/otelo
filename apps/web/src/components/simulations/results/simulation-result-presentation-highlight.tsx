'use client'

import { parseAsBoolean, useQueryState } from 'nuqs'
import { ReactNode } from 'react'
import styles from './simulation-result-presentation-highlight.module.css'

type SimulationResultPresentationHighlightProps = {
  children: ReactNode
}

export const SimulationResultPresentationHighlight = ({ children }: SimulationResultPresentationHighlightProps) => {
  const [presentation] = useQueryState('presentation', parseAsBoolean.withDefault(false))

  if (!presentation) return null

  return <div className={styles.container}>{children}</div>
}
