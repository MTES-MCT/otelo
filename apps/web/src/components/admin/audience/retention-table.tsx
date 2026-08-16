'use client'

import type { TRetentionCohort } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
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
  <div className={ADMIN_CARD}>
    <div className={ADMIN_CARD_HEADER}>
      <div>
        <h3 className={classNames('fr-m-0', styles.cardTitle)}>Rétention par cohorte</h3>
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
      <div className="fr-table fr-m-0">
        <table className="fr-width-full">
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
