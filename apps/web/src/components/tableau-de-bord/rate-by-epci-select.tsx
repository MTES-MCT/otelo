'use client'

import { useState } from 'react'
import type { EvolutionDirection, RateEvolution } from '~/app/(authenticated)/tableaux-de-bord/comparison-data'
import { EvolutionBadge } from './evolution-badge'
import styles from './rate-by-epci-select.module.css'

interface RateByEpciSelectProps {
  entries: Array<{ epciCode: string; epciName: string; label: string; evolution?: RateEvolution }>
  evolutionDirection?: EvolutionDirection
}

export function RateByEpciSelect({ entries, evolutionDirection }: RateByEpciSelectProps) {
  const [selectedCode, setSelectedCode] = useState(entries[0]?.epciCode ?? '')
  const selected = entries.find((e) => e.epciCode === selectedCode) ?? entries[0]

  if (!selected) return null

  return (
    <div className={styles.root}>
      <span className={styles.value}>
        {selected.label}
        {selected.evolution && <EvolutionBadge evolution={selected.evolution} direction={evolutionDirection} />}
      </span>
      <label className={styles.selector}>
        <span className={styles.epciLabel}>{selected.epciName}</span>
        <span className={`ri-arrow-down-s-line ${styles.caret}`} aria-hidden />
        <select
          className={styles.select}
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
          aria-label="Choisir un EPCI"
        >
          {entries.map((e) => (
            <option key={e.epciCode} value={e.epciCode}>
              {e.epciName}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
