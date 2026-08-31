'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useCsvExport } from '~/hooks/use-csv-export'

/**
 * Exports portant sur l'intégralité de l'historique.
 *
 * Contrairement aux jeux de données de `/admin/exports`, ceux-ci ne prennent pas de
 * période : leurs requêtes agrègent par utilisateur ou par scénario sur plusieurs CTE,
 * sans axe temporel exploitable.
 */
const HISTORICAL_EXPORTS = [
  { endpoint: '/api/statistics/template', filename: 'export-template.csv', icon: 'ri-user-line', label: 'Export template Alexandre' },
  { endpoint: '/api/statistics/users', filename: 'export-utilisateur.csv', icon: 'ri-user-line', label: 'Export rapports utilisateurs' },
  {
    endpoint: '/api/statistics/simulations',
    filename: 'export-scenarios.csv',
    icon: 'ri-folder-chart-line',
    label: 'Export rapports scénarios',
  },
  { endpoint: '/api/statistics/results', filename: 'export-resultats.csv', icon: 'ri-bar-chart-line', label: 'Export résultats' },
] as const

function HistoricalExportButton({ endpoint, filename, icon, label }: (typeof HISTORICAL_EXPORTS)[number]) {
  const { exportCsv, isPending } = useCsvExport(endpoint, filename)

  return (
    <Button
      className="fr-flex fr-justify-content-center"
      disabled={isPending}
      iconId={icon}
      onClick={() => exportCsv({})}
      style={{ flex: 1, width: '300px' }}
    >
      {isPending ? 'Export en cours...' : label}
    </Button>
  )
}

export default function StatisticsExportButtons() {
  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v">
      <div className="fr-flex fr-flex-gap-2v" style={{ alignItems: 'stretch' }}>
        {HISTORICAL_EXPORTS.slice(0, 2).map((entry) => (
          <HistoricalExportButton key={entry.endpoint} {...entry} />
        ))}
      </div>
      <div className="fr-flex fr-flex-gap-2v" style={{ alignItems: 'stretch' }}>
        {HISTORICAL_EXPORTS.slice(2).map((entry) => (
          <HistoricalExportButton key={entry.endpoint} {...entry} />
        ))}
      </div>
    </div>
  )
}
