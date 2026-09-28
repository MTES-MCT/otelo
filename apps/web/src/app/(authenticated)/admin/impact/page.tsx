'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import { ImpactSummary } from '~/components/admin/impact/impact-summary'
import { PerceivedUtility } from '~/components/admin/impact/perceived-utility'
import { PlanningDocumentsUsage } from '~/components/admin/impact/planning-documents-usage'
import { SettingsUsage } from '~/components/admin/impact/settings-usage'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { PeriodSelector, usePeriodRange } from '~/components/admin/shared/period-selector'
import { useImpactStatistics } from '~/hooks/use-impact-statistics'

export default function ImpactPage() {
  const { range } = usePeriodRange()
  const { data, error, isLoading } = useImpactStatistics(range)

  return (
    <>
      <AdminPageHeader
        icon="fr-icon-award-line"
        subtitle="Comment les scénarios sont construits, pour quels documents d'urbanisme, et ce qu'il en sort."
        title="Impact & utilité"
      />

      <PeriodSelector />

      {error && <Alert className="fr-mb-3w" description="Erreur lors du chargement des données" severity="error" small />}

      <Alert
        className="fr-mb-3w"
        description="Chaque section a sa propre date de référence : la création du scénario pour le paramétrage, la création du dossier pour les documents d'urbanisme, la date d'export pour l'impact. Les comptes de l'équipe Otelo sont exclus."
        severity="info"
        small
      />

      <SettingsUsage isLoading={isLoading} settings={data?.settings} />
      <PlanningDocumentsUsage isLoading={isLoading} planningDocuments={data?.planningDocuments} />
      <ImpactSummary impact={data?.impact} isLoading={isLoading} />
      <PerceivedUtility isLoading={isLoading} perceivedUtility={data?.perceivedUtility} range={range} />
    </>
  )
}
