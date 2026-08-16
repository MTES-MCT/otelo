'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import classNames from 'classnames'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ActivationFunnel } from '~/components/admin/audience/activation-funnel'
import { RetentionTable } from '~/components/admin/audience/retention-table'
import { SharingUsage } from '~/components/admin/audience/sharing-usage'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { ADMIN_CHART_GRID, chartColor } from '~/components/admin/shared/admin-colors'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { ChartCard } from '~/components/admin/shared/chart-card'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import { MatomoLink } from '~/components/admin/shared/matomo-link'
import { PeriodSelector, usePeriodRange } from '~/components/admin/shared/period-selector'
import { StatCard } from '~/components/admin/shared/stat-card'
import { useActivationStatistics, useAudienceStatistics } from '~/hooks/use-audience-statistics'
import { formatChartMonth, formatDate, formatDuration } from '~/utils/date-helpers'

export default function AudiencePage() {
  const { range } = usePeriodRange()
  const { data: audience, error, isLoading } = useAudienceStatistics(range)
  const { data: activation, isLoading: isActivationLoading } = useActivationStatistics(range)

  const trackingStartedAt = audience?.loginTrackingStartedAt

  return (
    <>
      <AdminPageHeader
        icon="fr-icon-line-chart-line"
        subtitle="Connexions, temps passé et usage des fonctionnalités, mesurés en base."
        title="Audience & usage"
      />

      <PeriodSelector />

      {error && <Alert className="fr-mb-3w" description="Erreur lors du chargement des données" severity="error" small />}

      {trackingStartedAt && new Date(trackingStartedAt) > new Date(range.from) && (
        <Alert
          className="fr-mb-3w"
          description={`Le journal des connexions démarre le ${formatDate(trackingStartedAt)}. Avant cette date, aucune connexion n'était enregistrée : les périodes antérieures apparaissent vides, et non à zéro.`}
          severity="info"
          small
          title="Historique partiel"
        />
      )}

      <h2 className="fr-h5">Connexions</h2>
      <div className={classNames('fr-mb-3w', styles.statsGrid)}>
        <StatCard
          accent="blue"
          icon="fr-icon-account-circle-line"
          isLoading={isLoading}
          label="Connexions"
          value={audience?.connections.total ?? 0}
        />
        <StatCard
          accent="green"
          hint="Utilisateurs distincts sur la période"
          icon="fr-icon-team-line"
          isLoading={isLoading}
          label="Utilisateurs actifs"
          value={audience?.connections.uniqueUsers ?? 0}
        />
        <StatCard
          accent="purple"
          hint="Toutes sessions cumulées"
          icon="fr-icon-time-line"
          isLoading={isLoading}
          label="Temps connecté"
          value={formatDuration(audience?.connectedTime.totalSeconds ?? 0)}
        />
        <StatCard
          accent="orange"
          hint="Granularité de 15 min : les sessions plus courtes comptent pour 0"
          icon="fr-icon-timer-line"
          isLoading={isLoading}
          label="Durée moyenne"
          value={formatDuration(audience?.connectedTime.avgSessionSeconds ?? 0)}
        />
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <ChartCard
          actions={<ExportCsvButton dataset="connexions-mensuelles" label="CSV" priority="tertiary" />}
          isEmpty={!audience?.connections.byMonth.length}
          isLoading={isLoading}
          title="Connexions par mois"
        >
          <LineChart data={audience?.connections.byMonth ?? []}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} tickFormatter={formatChartMonth} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip labelFormatter={(value) => formatChartMonth(String(value))} />
            <Legend />
            <Line dataKey="nbConnections" dot={false} name="Connexions" stroke={chartColor(0)} strokeWidth={2} type="monotone" />
            <Line dataKey="activeUsers" dot={false} name="Utilisateurs actifs" stroke={chartColor(1)} strokeWidth={2} type="monotone" />
          </LineChart>
        </ChartCard>

        <ChartCard
          hint="Connexions par type d'organisme, sur la période"
          isEmpty={!audience?.connections.byUserType.length}
          isLoading={isLoading}
          title="Répartition par organisme"
        >
          <BarChart data={audience?.connections.byUserType ?? []}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="userType" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="nbConnections" fill={chartColor(0)} name="Connexions" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <SharingUsage isLoading={isLoading} sharing={audience?.sharing} />

      <h2 className="fr-h5 fr-mt-4w">Activation &amp; rétention</h2>
      <div className="fr-mb-3w">
        <ActivationFunnel funnel={activation?.funnel} isLoading={isActivationLoading} />
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <RetentionTable isLoading={isActivationLoading} retention={activation?.retention} />
        <div className={ADMIN_CARD}>
          <div className={ADMIN_CARD_HEADER}>
            <h3 className={classNames('fr-m-0', styles.cardTitle)}>Engagement</h3>
            <ExportCsvButton dataset="activation" label="CSV" priority="tertiary" />
          </div>
          <div className="fr-p-3w">
            <p className="fr-text--sm">
              <strong>{activation?.neverConnected ?? 0}</strong> compte(s) créé(s) sur la période ne se sont jamais connectés.
            </p>
            <p className="fr-text--sm fr-mb-0">
              <strong>{activation?.singleConnection ?? 0}</strong> compte(s) ne se sont connectés qu'une seule fois.
            </p>
          </div>
        </div>
      </div>

      <h2 className="fr-h5 fr-mt-4w">Mesuré via Matomo</h2>
      <div className={ADMIN_CARD}>
        <div className="fr-p-3w">
          <p className="fr-text--sm">
            Les parcours, les abandons dans le wizard et les pages du guide réellement lues ne laissent aucune trace en base : ils ne sont
            observables que dans Matomo. Ces chiffres sont soumis aux bloqueurs de traqueurs et ne doivent pas servir de donnée officielle.
          </p>
          <div className="fr-flex fr-flex-wrap fr-flex-gap-2v">
            <MatomoLink label="Visites & temps passé" range={range} report="visitsSummary" />
            <MatomoLink label="Pages consultées" range={range} report="pages" />
            <MatomoLink label="Événements" range={range} report="events" />
            <MatomoLink label="Recherches internes" range={range} report="siteSearch" />
            <MatomoLink label="Sources de trafic" range={range} report="referrers" />
          </div>
        </div>
      </div>
    </>
  )
}
