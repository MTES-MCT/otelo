'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import classNames from 'classnames'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { StatCard } from '~/components/admin/shared/stat-card'
import StatisticsExportButtons from '~/components/admin/statistics-export-buttons'
import { useStatistics } from '~/hooks/use-statistics'

export default function StatistiquesPage() {
  const { data: statistics, error, isLoading } = useStatistics()

  return (
    <>
      <AdminPageHeader
        actions={<StatisticsExportButtons />}
        icon="fr-icon-bar-chart-box-line"
        subtitle="Volumes produits par l'outil : scénarios, territoires couverts, besoins estimés."
        title="Statistiques métier"
      />

      {error && <Alert className="fr-mb-3w" description="Erreur lors du chargement des statistiques" severity="error" small />}

      <div className={classNames('fr-mb-3w', styles.statsGrid)}>
        <StatCard
          accent="blue"
          icon="fr-icon-file-text-line"
          isLoading={isLoading}
          label="Scénarios créés"
          value={statistics?.totalScenarios ?? 0}
        />
        <StatCard
          accent="purple"
          icon="fr-icon-user-line"
          isLoading={isLoading}
          label="Moyenne par utilisateur"
          value={statistics?.averageScenariosPerUser?.toFixed(2) ?? '0'}
        />
        <StatCard
          accent="green"
          hint="EPCI avec au moins un scénario sur 6 mois"
          icon="fr-icon-map-pin-2-line"
          isLoading={isLoading}
          label="EPCI actifs"
          value={statistics?.activeEpcisCount ?? 0}
        />
        <StatCard
          accent="orange"
          hint="Scénario créé sur 3 mois ou au moins un export"
          icon="fr-icon-team-line"
          isLoading={isLoading}
          label="Utilisateurs actifs"
          value={statistics?.usersWithExportedScenarios?.total ?? 0}
        />
      </div>

      <h2 className="fr-h5">Exports réalisés</h2>
      <div className={classNames('fr-mb-3w', styles.statsGrid)}>
        <StatCard
          accent="blue"
          hint="Utilisateurs ayant exporté le paramétrage"
          icon="fr-icon-file-download-line"
          isLoading={isLoading}
          label="Export Excel"
          value={statistics?.usersWithExportedScenarios?.excel ?? 0}
        />
        <StatCard
          accent="purple"
          hint="Demandes de présentation PowerPoint"
          icon="fr-icon-slideshow-line"
          isLoading={isLoading}
          label="Export PowerPoint"
          value={statistics?.usersWithExportedScenarios?.powerpoint ?? 0}
        />
      </div>

      <h2 className="fr-h5">Volumes des scénarios exportés</h2>
      <div className={styles.statsGrid}>
        <StatCard
          accent="blue"
          hint="Volume total sur les scénarios exportés"
          isLoading={isLoading}
          label="Besoins en logements"
          value={statistics?.totalHousingNeedsSum ?? 0}
        />
        <StatCard
          accent="orange"
          hint="Volume total d'engagement"
          isLoading={isLoading}
          label="Lutte contre le mal-logement"
          value={statistics?.totalStockSum ?? 0}
        />
        <StatCard
          accent="green"
          hint="Volume de remobilisation"
          isLoading={isLoading}
          label="Logements vacants"
          value={statistics?.totalVacantSum ?? 0}
        />
      </div>
    </>
  )
}
