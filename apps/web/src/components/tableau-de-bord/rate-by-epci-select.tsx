'use client'

import { useState } from 'react'
import styles from './rate-by-epci-select.module.css'

interface RateByEpciSelectProps {
  entries: Array<{ epciCode: string; epciName: string; label: string }>
}

export function RateByEpciSelect({ entries }: RateByEpciSelectProps) {
  const [selectedCode, setSelectedCode] = useState(entries[0]?.epciCode ?? '')
  const selected = entries.find((e) => e.epciCode === selectedCode) ?? entries[0]

  if (!selected) return null

  return (
    <div className={styles.root}>
      <span className={styles.value}>{selected.label}</span>
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
