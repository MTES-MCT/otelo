'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { StatCard } from '~/components/admin/shared/stat-card'
import { useAdminOverview } from '~/hooks/use-admin-overview'
import { useStatistics } from '~/hooks/use-statistics'

export default function AdminDashboardPage() {
  const { data: overview, error: overviewError, isLoading: isOverviewLoading } = useAdminOverview()
  const { data: statistics, isLoading: isStatisticsLoading } = useStatistics()

  return (
    <>
      <AdminPageHeader
        icon="fr-icon-dashboard-3-line"
        subtitle="Vue d'ensemble de la plateforme : comptes, production de scénarios et partage."
        title="Tableau de bord"
      />

      {overviewError && (
        <Alert className={fr.cx('fr-mb-3w')} description="Erreur lors du chargement des compteurs" severity="error" small />
      )}

      <h2 className={fr.cx('fr-h5')}>Comptes</h2>
      <div className={`${styles.statsGrid} ${fr.cx('fr-mb-3w')}`}>
        <StatCard accent="blue" icon="fr-icon-team-line" isLoading={isOverviewLoading} label="Utilisateurs" value={overview?.users ?? 0} />
        <StatCard
          accent="green"
          hint="Acte d'engagement signé"
          icon="fr-icon-check-line"
          isLoading={isOverviewLoading}
          label="Avec accès"
          value={overview?.usersWithAccess ?? 0}
        />
        <StatCard
          accent="orange"
          hint="Comptes créés en attente d'octroi"
          icon="fr-icon-time-line"
          isLoading={isOverviewLoading}
          label="En attente d'accès"
          value={overview?.usersPending ?? 0}
        />
        <StatCard
          accent="purple"
          icon="fr-icon-questionnaire-line"
          isLoading={isOverviewLoading}
          label="Retours reçus"
          value={overview?.feedbacks ?? 0}
        />
      </div>

      <h2 className={fr.cx('fr-h5')}>Production</h2>
      <div className={`${styles.statsGrid} ${fr.cx('fr-mb-3w')}`}>
        <StatCard
          accent="blue"
          icon="fr-icon-file-text-line"
          isLoading={isOverviewLoading}
          label="Scénarios"
          value={overview?.scenarios ?? 0}
        />
        <StatCard
          accent="purple"
          hint="Hors scénarios supprimés"
          icon="fr-icon-list-unordered"
          isLoading={isOverviewLoading}
          label="Simulations actives"
          value={overview?.simulations ?? 0}
        />
        <StatCard
          accent="green"
          icon="fr-icon-folder-2-line"
          isLoading={isOverviewLoading}
          label="Dossiers d'études"
          value={overview?.epciGroups ?? 0}
        />
        <StatCard
          accent="orange"
          hint="Liens de partage actuellement ouverts"
          icon="fr-icon-share-line"
          isLoading={isOverviewLoading}
          label="Partages actifs"
          value={overview?.activeShareLinks ?? 0}
        />
      </div>

      <h2 className={fr.cx('fr-h5')}>Couverture</h2>
      <div className={`${styles.statsGrid} ${fr.cx('fr-mb-3w')}`}>
        <StatCard
          accent="green"
          hint="EPCI avec au moins un scénario sur 6 mois"
          icon="fr-icon-map-pin-2-line"
          isLoading={isStatisticsLoading}
          label="EPCI actifs"
          value={statistics?.activeEpcisCount ?? 0}
        />
        <StatCard
          accent="blue"
          icon="fr-icon-user-line"
          isLoading={isStatisticsLoading}
          label="Scénarios par utilisateur"
          value={statistics?.averageScenariosPerUser?.toFixed(2) ?? '0'}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Aller plus loin</h2>
        </div>
        <div className={fr.cx('fr-p-3w')}>
          <p className={fr.cx('fr-text--sm')}>
            Les connexions, le temps passé et l'usage du partage sont mesurés en base et détaillés dans « Audience &amp; usage ». Les
            parcours et les abandons, eux, ne sont observables que dans Matomo.
          </p>
          <div className="fr-flex fr-flex-gap-2v">
            <Button linkProps={{ href: '/admin/audience' }} priority="secondary">
              Audience &amp; usage
            </Button>
            <Button linkProps={{ href: '/admin/statistiques' }} priority="tertiary">
              Statistiques métier
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
