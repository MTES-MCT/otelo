'use client'

import { fr } from '@codegouvfr/react-dsfr'
import type { TRetentionCohort } from '@shared'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import { formatChartMonth } from '~/utils/date-helpers'

type RetentionTableProps = {
  retention?: TRetentionCohort[]
  isLoading?: boolean
}

function share(part: number, total: number): string {
  return total === 0 ? '—' : `${Math.round((part / total) * 100)} %`
}

export const RetentionTable: FC<RetentionTableProps> = ({ isLoading, retention }) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>
      <div>
        <h3 className={styles.cardTitle}>Rétention par cohorte</h3>
        <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
          Part des inscrits d'un mois encore actifs un et trois mois après.
        </p>
      </div>
      <ExportCsvButton dataset="retention" label="CSV" priority="tertiary" />
    </div>

    {isLoading ? (
      <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Chargement…</p>
    ) : !retention?.length ? (
      <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Aucune cohorte sur cette période.</p>
    ) : (
      <div className={fr.cx('fr-table')} style={{ margin: 0 }}>
        <table>
          <thead>
            <tr>
              <th scope="col">Cohorte</th>
              <th scope="col">Inscrits</th>
              <th scope="col">Activés</th>
              <th scope="col">M+1</th>
              <th scope="col">M+3</th>
            </tr>
          </thead>
          <tbody>
            {retention.map((row) => (
              <tr key={row.cohort}>
                <td>{formatChartMonth(row.cohort)}</td>
                <td>{row.signups.toLocaleString('fr-FR')}</td>
                <td>
                  {row.activated.toLocaleString('fr-FR')}{' '}
                  <span className="fr-text--xs fr-text-mention--grey">({share(row.activated, row.signups)})</span>
                </td>
                <td>{share(row.retainedM1, row.signups)}</td>
                <td>{share(row.retainedM3, row.signups)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)
