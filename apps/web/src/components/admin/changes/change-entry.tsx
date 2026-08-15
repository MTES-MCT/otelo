'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { SIMULATION_CHANGE_ACTION_SEVERITY, type SimulationChangeAction, type TSimulationChange } from '@shared'
import type { FC } from 'react'
import styles from './change-entry.module.css'

/** Rend une valeur de paramètre lisible : les taux sont des flottants, les listes des tableaux. */
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'oui' : 'non'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(4)
  }

  return String(value)
}

type ChangeEntryProps = {
  change: TSimulationChange
}

export const ChangeEntry: FC<ChangeEntryProps> = ({ change }) => {
  const severity = SIMULATION_CHANGE_ACTION_SEVERITY[change.action as SimulationChangeAction] ?? 'info'

  return (
    <li className={styles.entry}>
      <div className={styles.header}>
        <Badge severity={severity} small>
          {change.actionLabel}
        </Badge>
        <span className="fr-text--sm fr-text--bold">{change.simulationName}</span>
        <span className="fr-text--xs fr-text-mention--grey">
          {change.userName ?? 'Auteur inconnu'} — {new Date(change.createdAt).toLocaleString('fr-FR')}
        </span>
      </div>

      {change.changes.length > 0 && (
        <table className={styles.diff}>
          <tbody>
            {change.changes.map((entry) => (
              <tr key={entry.field}>
                <th scope="row">{entry.label}</th>
                <td className={styles.before}>{formatValue(entry.before)}</td>
                <td aria-hidden="true" className={styles.arrow}>
                  →
                </td>
                <td className={styles.after}>{formatValue(entry.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </li>
  )
}
