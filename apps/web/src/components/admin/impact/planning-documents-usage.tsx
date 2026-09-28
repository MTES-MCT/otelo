'use client'

import { IMPACT_PLANNING_DOCUMENT_KEYS, IMPACT_PLANNING_DOCUMENT_LABELS, type TImpactStatistics, USER_TYPE_LABELS } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { ADMIN_CHART_GRID, chartColor } from '~/components/admin/shared/admin-colors'
import { ChartCard } from '~/components/admin/shared/chart-card'
import { formatChartMonth, formatNumber, formatPercentage } from '~/utils/date-helpers'

type PlanningDocumentsUsageProps = {
  planningDocuments?: TImpactStatistics['planningDocuments']
  isLoading?: boolean
}

function userTypeLabel(userType: string | null): string {
  return userType === null ? 'Non renseigné' : (USER_TYPE_LABELS[userType as keyof typeof USER_TYPE_LABELS] ?? userType)
}

export const PlanningDocumentsUsage: FC<PlanningDocumentsUsageProps> = ({ isLoading, planningDocuments }) => {
  const byUserType = planningDocuments?.byUserType ?? []
  const userTypes = [...new Set(byUserType.map((row) => row.userType))]
  const cell = (userType: string | null, documentType: string) =>
    byUserType.find((row) => row.userType === userType && row.documentType === documentType)?.dossiers ?? 0

  return (
    <>
      <h2 className="fr-h5 fr-mt-4w">Documents d'urbanisme</h2>
      <p className="fr-text--sm fr-text-mention--grey">
        Dossiers d'études créés sur la période, selon le document déclaré à l'étape « Choix du territoire ».
      </p>

      <div className={classNames('fr-mb-3w', ADMIN_CARD)}>
        <div className={ADMIN_CARD_HEADER}>
          <h3 className={classNames('fr-m-0', styles.cardTitle)}>Usage par type de document</h3>
        </div>
        {isLoading ? (
          <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Chargement…</p>
        ) : (
          <div className={classNames('fr-table fr-m-0', styles.tableWrapper)}>
            <table className="fr-width-full">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Dossiers</th>
                  <th scope="col">Scénarios</th>
                  <th scope="col">Scénarios / dossier</th>
                  <th scope="col">EPCI / dossier</th>
                  <th scope="col">Taux d'export</th>
                  <th scope="col">Délai médian avant export</th>
                </tr>
              </thead>
              <tbody>
                {planningDocuments?.byType.map((row) => (
                  <tr key={row.documentType}>
                    <td>{IMPACT_PLANNING_DOCUMENT_LABELS[row.documentType]}</td>
                    <td>{formatNumber(row.dossiers)}</td>
                    <td>{formatNumber(row.simulations)}</td>
                    <td>{row.dossiers ? formatNumber(row.avgSimulationsPerDossier) : '—'}</td>
                    <td>{row.dossiers ? formatNumber(row.avgEpcisPerDossier) : '—'}</td>
                    <td>{row.dossiers ? formatPercentage(row.exportRate) : '—'}</td>
                    <td>{row.medianDaysToExport === null ? '—' : `${formatNumber(row.medianDaysToExport)} j`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <ChartCard
          hint="Dossiers créés chaque mois, par document"
          isEmpty={!planningDocuments?.byMonth.length}
          isLoading={isLoading}
          title="Évolution mensuelle"
        >
          <BarChart data={planningDocuments?.byMonth ?? []}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} tickFormatter={formatChartMonth} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip labelFormatter={(value) => formatChartMonth(String(value))} />
            <Legend />
            {IMPACT_PLANNING_DOCUMENT_KEYS.map((key, index) => (
              <Bar dataKey={key} fill={chartColor(index)} key={key} name={IMPACT_PLANNING_DOCUMENT_LABELS[key]} stackId="documents" />
            ))}
          </BarChart>
        </ChartCard>

        <div className={ADMIN_CARD}>
          <div className={ADMIN_CARD_HEADER}>
            <div>
              <h3 className={classNames('fr-m-0', styles.cardTitle)}>Qui travaille sur quel document</h3>
              <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">Dossiers par type d'organisme et type de document.</p>
            </div>
          </div>
          {userTypes.length ? (
            <div className={classNames('fr-table fr-m-0', styles.tableWrapper)}>
              <table className="fr-width-full">
                <thead>
                  <tr>
                    <th scope="col">Organisme</th>
                    {IMPACT_PLANNING_DOCUMENT_KEYS.map((key) => (
                      <th key={key} scope="col">
                        {IMPACT_PLANNING_DOCUMENT_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userTypes.map((userType) => (
                    <tr key={userType ?? 'none'}>
                      <td>{userTypeLabel(userType)}</td>
                      {IMPACT_PLANNING_DOCUMENT_KEYS.map((key) => (
                        <td key={key}>{cell(userType, key) || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Aucun dossier créé sur cette période.</p>
          )}
        </div>
      </div>
    </>
  )
}
