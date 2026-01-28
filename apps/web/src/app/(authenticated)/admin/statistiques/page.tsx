'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { Card } from '@codegouvfr/react-dsfr/Card'
import StatisticsExportButtons from '~/components/admin/statistics-export-buttons'
import { useStatistics } from '~/hooks/use-statistics'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  colClass?: string
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className={fr.cx('fr-col-12', 'fr-col-md-6', 'fr-col-lg-4')}>
      <Card
        title={title}
        titleAs="h3"
        desc={
          <>
            <span className={fr.cx('fr-display--lg', 'fr-mb-0')} style={{ display: 'block' }}>
              {value}
            </span>
            <span className={fr.cx('fr-text--sm')}>{description}</span>
          </>
        }
      />
    </div>
  )
}

export default function StatistiquesPage() {
  const { data: statistics, isLoading, error } = useStatistics()

  if (isLoading) {
    return (
      <div className={fr.cx('fr-container', 'fr-py-10v')}>
        <h1>Statistiques</h1>
        <p>Chargement des statistiques...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={fr.cx('fr-container', 'fr-py-10v')}>
        <h1>Statistiques</h1>
        <div className={fr.cx('fr-alert', 'fr-alert--error')}>
          <p>Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    )
  }

  return (
    <div className={fr.cx('fr-container', 'fr-py-10v')}>
      <div className="fr-flex fr-justify-content-space-between">
        <h1>Statistiques</h1>
        <StatisticsExportButtons />
      </div>

      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-mt-5v')}>
        <StatCard title="Scénarios créés" value={statistics?.totalScenarios || 0} description="Nombre total de scénarios" />
        <StatCard
          title="Moyenne par utilisateur"
          value={statistics?.averageScenariosPerUser.toFixed(2) || 0}
          description="Scénarios par utilisateur"
        />
        <StatCard title="EPCI actifs" value={statistics?.activeEpcisCount || 0} description="EPCI avec scénarios (6 derniers mois)" />
        <StatCard
          title="Utilisateurs actifs"
          value={statistics?.usersWithExportedScenarios.total || 0}
          description="Utilisateurs ayant créé une simulation dans les 3 derniers mois ou ayant exporté au moins un scénario"
        />
        <StatCard
          title="Export Excel"
          value={statistics?.usersWithExportedScenarios.excel || 0}
          description="Utilisateurs ayant exporté le paramétrage"
        />
        <StatCard
          title="Export Powerpoint"
          value={statistics?.usersWithExportedScenarios.powerpoint || 0}
          description="Utilisateurs ayant fait une demande d'export powerpoint"
        />
      </div>

      <h2 className={fr.cx('fr-mt-8v')}>Statistiques des scénarios exportés</h2>

      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-mt-3v')}>
        <StatCard
          title="Besoins en logements"
          value={statistics?.totalHousingNeedsSum || 0}
          description="Volume total sur l'ensemble des scénarios exportés"
        />
        <StatCard title="Lutte contre le mal-logement" value={statistics?.totalStockSum || 0} description="Volume total d'engagement" />
        <StatCard title="Logements vacants" value={statistics?.totalVacantSum || 0} description="Volume de remobilisation" />
      </div>
    </div>
  )
}
