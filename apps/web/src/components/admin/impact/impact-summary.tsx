'use client'

import { type TImpactStatistics, USER_TYPE_LABELS } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { TerritoryNeeds } from '~/components/admin/impact/territory-needs'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { ADMIN_CHART_GRID, chartColor } from '~/components/admin/shared/admin-colors'
import { ChartCard } from '~/components/admin/shared/chart-card'
import { StatCard } from '~/components/admin/shared/stat-card'
import { formatNumber, formatPercentage } from '~/utils/date-helpers'

type ImpactSummaryProps = {
  impact?: TImpactStatistics['impact']
  isLoading?: boolean
}

function share(part: number, total: number): string {
  return total === 0 ? '—' : `${((part / total) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function formatPopulation(value: number): string {
  return value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`
    : value.toLocaleString('fr-FR')
}

export const ImpactSummary: FC<ImpactSummaryProps> = ({ impact, isLoading }) => (
  <>
    <h2 className="fr-h5 fr-mt-4w">Impact : Otelo sert-il à décider ?</h2>
    <p className="fr-text--sm fr-text-mention--grey">
      Scénarios exportés (PowerPoint ou Excel) sur la période : ceux qui sortent d'Otelo pour nourrir un document ou une décision.
    </p>

    <div className={classNames('fr-mb-3w', styles.statsGrid)}>
      <StatCard
        accent="blue"
        hint="Une demande peut porter plusieurs scénarios"
        icon="fr-icon-slideshow-line"
        isLoading={isLoading}
        label="Demandes de PowerPoint"
        value={impact?.powerpointRequests ?? 0}
      />
      <StatCard
        accent="green"
        hint="Demandes destinées aux élus ou à une prise de décision"
        icon="fr-icon-government-line"
        isLoading={isLoading}
        label="Usage décisionnel"
        value={formatPercentage(impact?.decisionRate ?? 0)}
      />
      <StatCard
        accent="purple"
        hint={`${share(impact?.exportedEpcis ?? 0, impact?.totalEpcis ?? 0)} des ${formatNumber(impact?.totalEpcis ?? 0)} EPCI`}
        icon="fr-icon-map-pin-2-line"
        isLoading={isLoading}
        label="EPCI couverts"
        value={impact?.exportedEpcis ?? 0}
      />
      <StatCard
        accent="orange"
        hint={`${share(impact?.coveredPopulation ?? 0, impact?.totalPopulation ?? 0)} de la population (dernier recensement)`}
        icon="fr-icon-team-line"
        isLoading={isLoading}
        label="Population couverte"
        value={formatPopulation(impact?.coveredPopulation ?? 0)}
      />
    </div>

    <div className={classNames('fr-mb-3w', styles.statsGrid)}>
      <StatCard
        accent="green"
        hint={`${formatNumber(impact?.sharing.totalViews ?? 0)} consultation(s) cumulée(s), tous liens confondus`}
        icon="fr-icon-eye-line"
        isLoading={isLoading}
        label="Liens de partage consultés"
        value={`${formatNumber(impact?.sharing.viewedLinks ?? 0)} / ${formatNumber(impact?.sharing.activeLinks ?? 0)}`}
      />
      <StatCard
        accent="purple"
        hint="EPCI travaillés par au moins deux types d'organismes"
        icon="fr-icon-chat-3-line"
        isLoading={isLoading}
        label="Territoires en dialogue"
        value={impact?.sharedEpcis.count ?? 0}
      />
      <StatCard
        accent="orange"
        hint={`Retravaillés plus de 3 mois après leur création, sur ${formatNumber(impact?.longTermUse.activeDossiers ?? 0)} dossier(s) actif(s)`}
        icon="fr-icon-calendar-line"
        isLoading={isLoading}
        label="Dossiers repris"
        value={impact?.longTermUse.resumedDossiers ?? 0}
      />
    </div>

    <div className={classNames('fr-mb-3w', styles.grid2)}>
      <ChartCard
        hint="Prochaine étape déclarée lors de la demande de PowerPoint"
        isEmpty={!impact?.byNextStep.length}
        isLoading={isLoading}
        title="Usage prévu des exports"
      >
        <BarChart data={impact?.byNextStep ?? []} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
          <XAxis allowDecimals={false} fontSize={11} type="number" />
          <YAxis dataKey="label" fontSize={11} type="category" width={150} />
          <Tooltip />
          <Bar dataKey="count" fill={chartColor(0)} name="Demandes" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard
        hint="Document saisi lors de la demande de PowerPoint (texte libre)"
        isEmpty={!impact?.byExportDocumentType.length}
        isLoading={isLoading}
        title="Document visé par les exports"
      >
        <BarChart data={impact?.byExportDocumentType ?? []} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
          <XAxis allowDecimals={false} fontSize={11} type="number" />
          <YAxis dataKey="label" fontSize={11} type="category" width={150} />
          <Tooltip />
          <Bar dataKey="count" fill={chartColor(1)} name="Demandes" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>
    </div>

    <TerritoryNeeds isLoading={isLoading} territoryNeeds={impact?.territoryNeeds} />

    <div className={classNames('fr-mb-3w', ADMIN_CARD)}>
      <div className={ADMIN_CARD_HEADER}>
        <div>
          <h3 className={classNames('fr-m-0', styles.cardTitle)}>Territoires en dialogue</h3>
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
            EPCI sur lesquels plusieurs types d'organismes ont créé un scénario pendant la période (10 premiers).
          </p>
        </div>
      </div>
      {impact?.sharedEpcis.top.length ? (
        <div className={classNames('fr-table fr-m-0', styles.tableWrapper)}>
          <table className="fr-width-full">
            <thead>
              <tr>
                <th scope="col">EPCI</th>
                <th scope="col">Région</th>
                <th scope="col">Organismes</th>
                <th scope="col">Utilisateurs</th>
              </tr>
            </thead>
            <tbody>
              {impact.sharedEpcis.top.map((row) => (
                <tr key={row.epciCode}>
                  <td>{row.epciName}</td>
                  <td>{row.regionName ?? '—'}</td>
                  <td>{row.userTypes.map((type) => USER_TYPE_LABELS[type as keyof typeof USER_TYPE_LABELS] ?? type).join(', ')}</td>
                  <td>{formatNumber(row.users)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">
          Aucun EPCI travaillé par plusieurs types d'organismes sur cette période.
        </p>
      )}
    </div>
  </>
)
