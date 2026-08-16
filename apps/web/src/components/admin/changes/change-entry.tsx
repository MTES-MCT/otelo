'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { SIMULATION_CHANGE_ACTION_SEVERITY, type SimulationChangeAction, type TSimulationChange } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import styles from './change-entry.module.css'

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
    <li className={classNames('fr-px-5v fr-py-4v fr-border-top', styles.entry)}>
      <div className="fr-flex fr-flex-wrap fr-align-items-center fr-flex-gap-3v">
        <Badge severity={severity} small>
          {change.actionLabel}
        </Badge>
        <span className="fr-text--sm fr-text--bold">{change.simulationName}</span>
        <span className="fr-text--xs fr-text-mention--grey">
          {change.userName ?? 'Auteur inconnu'} — {new Date(change.createdAt).toLocaleString('fr-FR')}
        </span>
      </div>

      {change.changes.length > 0 && (
        <table className={classNames('fr-width-full fr-mt-3v', styles.diff)}>
          <tbody>
            {change.changes.map((entry) => (
              <tr key={entry.field}>
                <th className="fr-text-mention--grey" scope="row">
                  {entry.label}
                </th>
                <td className={classNames('fr-text-mention--grey', styles.before)}>{formatValue(entry.before)}</td>
                <td aria-hidden="true" className={classNames('fr-text--center fr-text-mention--grey', styles.arrow)}>
                  →
                </td>
                <td className="fr-text--medium fr-text-default--info">{formatValue(entry.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </li>
  )
}
