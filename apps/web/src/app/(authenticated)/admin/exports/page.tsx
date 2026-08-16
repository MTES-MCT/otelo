'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import classNames from 'classnames'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import { PeriodSelector } from '~/components/admin/shared/period-selector'
import StatisticsExportButtons from '~/components/admin/statistics-export-buttons'

type ExportEntry = {
  dataset: string
  label: string
  description: string
}

type ExportSection = {
  title: string
  entries: ExportEntry[]
}

const SECTIONS: ExportSection[] = [
  {
    title: 'Connexions et activation',
    entries: [
      {
        dataset: 'connexions',
        label: 'Connexions',
        description: 'Une ligne par connexion : date, utilisateur, organisme, région, méthode et durée.',
      },
      {
        dataset: 'connexions-mensuelles',
        label: 'Connexions mensuelles',
        description: 'Agrégat par mois : connexions, utilisateurs actifs, temps connecté cumulé et moyen.',
      },
      {
        dataset: 'activation',
        label: 'Activation',
        description:
          'Une ligne par utilisateur avec ses jalons : inscription, accès, première connexion, premier scénario, export, partage.',
      },
      {
        dataset: 'retention',
        label: 'Rétention',
        description: "Une ligne par cohorte mensuelle d'inscription, avec les taux d'activation et de retour.",
      },
    ],
  },
  {
    title: 'Usage des fonctionnalités',
    entries: [
      {
        dataset: 'partages',
        label: 'Partages',
        description: 'Une ligne par lien de partage : scénario, propriétaire, état et consultations cumulées.',
      },
      {
        dataset: 'exports',
        label: 'Exports réalisés',
        description: "Une ligne par export, avec le type de document et la prochaine étape déclarés lors d'une demande PowerPoint.",
      },
      {
        dataset: 'dossiers',
        label: "Dossiers d'études",
        description: "Une ligne par dossier : nombre de scénarios, d'EPCI et intention de document d'urbanisme.",
      },
      {
        dataset: 'changements',
        label: 'Modifications de scénarios',
        description: 'Une ligne par paramètre modifié : date, scénario, auteur, valeur avant et après.',
      },
      {
        dataset: 'feedbacks',
        label: 'Retours utilisateurs',
        description: 'Une ligne par retour soumis : note, commentaire, organisme et région.',
      },
    ],
  },
  {
    title: 'Technique',
    entries: [
      {
        dataset: 'calculs',
        label: 'Performance des calculs',
        description: "Durée et nombre d'EPCI de chaque calcul de résultats, pour situer le seuil de latence.",
      },
      {
        dataset: 'api',
        label: 'Volumétrie API',
        description: "Nombre d'appels par consommateur et par jour sur l'API externe.",
      },
    ],
  },
]

export default function ExportsPage() {
  return (
    <>
      <AdminPageHeader
        icon="fr-icon-download-line"
        subtitle="Chaque donnée mesurable est téléchargeable au format CSV, sur la période sélectionnée."
        title="Exports"
      />

      <PeriodSelector />

      <Alert
        className="fr-mb-3w"
        description="Les fichiers sont encodés en UTF-8 avec BOM et séparés par des points-virgules : ils s'ouvrent directement dans Excel, accents compris. Les exports nominatifs contiennent des données personnelles."
        severity="info"
        small
      />

      {SECTIONS.map((section) => (
        <div className={classNames(ADMIN_CARD, 'fr-mb-3w')} key={section.title}>
          <div className={ADMIN_CARD_HEADER}>
            <h2 className={classNames('fr-m-0', styles.cardTitle)}>{section.title}</h2>
          </div>
          <div className="fr-p-3w">
            {section.entries.map((entry, index) => (
              <div
                className={classNames('fr-flex fr-align-items-center fr-flex-gap-2v fr-py-3v', index > 0 && 'fr-border-top')}
                key={entry.dataset}
              >
                <div className={styles.exportEntryLabel}>
                  <div className="fr-text--sm fr-text--bold">{entry.label}</div>
                  <div className="fr-text--xs fr-text-mention--grey">{entry.description}</div>
                </div>
                <ExportCsvButton dataset={entry.dataset} label="Exporter" priority="tertiary" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={ADMIN_CARD}>
        <div className={ADMIN_CARD_HEADER}>
          <div>
            <h2 className={classNames('fr-m-0', styles.cardTitle)}>Exports historiques</h2>
            <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
              Ces quatre exports portent sur l'intégralité de l'historique et ne tiennent pas compte de la période sélectionnée : leurs
              requêtes agrègent par utilisateur ou par scénario, sans axe temporel exploitable.
            </p>
          </div>
        </div>
        <div className="fr-p-3w">
          <StatisticsExportButtons />
        </div>
      </div>
    </>
  )
}
