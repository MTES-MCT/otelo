'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'
import type { TAudienceStatistics } from '@shared'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import { StatCard } from '~/components/admin/shared/stat-card'
import { formatDate } from '~/utils/date-helpers'

type SharingUsageProps = {
  sharing?: TAudienceStatistics['sharing']
  isLoading?: boolean
}

export const SharingUsage: FC<SharingUsageProps> = ({ isLoading, sharing }) => (
  <>
    <h2 className={fr.cx('fr-h5', 'fr-mt-4w')}>Partage de scénarios</h2>

    <div className={`${styles.statsGrid} ${fr.cx('fr-mb-3w')}`}>
      <StatCard
        accent="blue"
        hint="Liens créés sur la période"
        icon="fr-icon-share-line"
        isLoading={isLoading}
        label="Liens créés"
        value={sharing?.linksCreated ?? 0}
      />
      <StatCard
        accent="green"
        hint={`${sharing?.simulationsCreated ?? 0} scénario(s) créé(s) sur la période`}
        icon="fr-icon-percent-line"
        isLoading={isLoading}
        label="Taux de partage"
        value={`${sharing?.activationRate ?? 0} %`}
      />
      <StatCard
        accent="purple"
        hint="Cumulées depuis la création des liens, non bornées par la période"
        icon="fr-icon-eye-line"
        isLoading={isLoading}
        label="Consultations"
        value={sharing?.totalViews ?? 0}
      />
      <StatCard
        accent="orange"
        hint="Liens partagés que personne n'a ouverts"
        icon="fr-icon-eye-off-line"
        isLoading={isLoading}
        label="Jamais consultés"
        value={sharing?.neverViewedLinks ?? 0}
      />
    </div>

    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Scénarios les plus consultés</h3>
        <ExportCsvButton dataset="partages" label="CSV" priority="tertiary" />
      </div>
      {sharing?.topShared.length ? (
        <div className={fr.cx('fr-table')} style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">Scénario</th>
                <th scope="col">Organisme</th>
                <th scope="col">État</th>
                <th scope="col">Consultations</th>
                <th scope="col">Dernière consultation</th>
              </tr>
            </thead>
            <tbody>
              {sharing.topShared.map((row) => (
                <tr key={row.simulationId}>
                  <td>{row.simulationName}</td>
                  <td>{row.ownerType ?? '—'}</td>
                  <td>
                    <Badge severity={row.active ? 'success' : 'info'} small>
                      {row.active ? 'Actif' : 'Désactivé'}
                    </Badge>
                  </td>
                  <td>{row.viewCount.toLocaleString('fr-FR')}</td>
                  <td>{formatDate(row.lastViewedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Aucun lien de partage créé sur cette période.</p>
      )}
    </div>
  </>
)
