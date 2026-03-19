'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useExportResultsStatistics } from '~/hooks/use-export-results-statistics'
import { useExportSimulationsStatistics } from '~/hooks/use-export-simulations-statistics'
import { useExportTemplateStatistics } from '~/hooks/use-export-template-statistics'
import { useExportUsersStatistics } from '~/hooks/use-export-users-statistics'

export default function StatisticsExportButtons() {
  const { isPending: isExportingTemplate, mutateAsync: exportTemplateStatistics } = useExportTemplateStatistics()
  const { isPending: isExportingUsers, mutateAsync: exportUsersStatistics } = useExportUsersStatistics()
  const { isPending: isExportingSimulations, mutateAsync: exportSimulationsStatistics } = useExportSimulationsStatistics()
  const { isPending: isExportingResults, mutateAsync: exportResultsStatistics } = useExportResultsStatistics()

  const handleExportTemplate = async () => {
    try {
      await exportTemplateStatistics()
    } catch (error) {
      console.error('Failed to export template statistics:', error)
    }
  }

  const handleExportUsers = async () => {
    try {
      await exportUsersStatistics()
    } catch (error) {
      console.error('Failed to export users statistics:', error)
    }
  }

  const handleExportSimulations = async () => {
    try {
      await exportSimulationsStatistics()
    } catch (error) {
      console.error('Failed to export simulations statistics:', error)
    }
  }

  const handleExportResults = async () => {
    try {
      await exportResultsStatistics()
    } catch (error) {
      console.error('Failed to export results statistics:', error)
    }
  }

  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v">
      <div className="fr-flex fr-flex-gap-2v" style={{ alignItems: 'stretch' }}>
        <Button
          style={{ flex: 1, width: '300px' }}
          className="fr-flex fr-justify-content-center"
          iconId="ri-user-line"
          onClick={handleExportTemplate}
          disabled={isExportingTemplate}
        >
          {isExportingTemplate ? 'Export en cours...' : 'Export template Alexandre'}
        </Button>
        <Button
          style={{ flex: 1, width: '300px' }}
          className="fr-flex fr-justify-content-center"
          iconId="ri-user-line"
          onClick={handleExportUsers}
          disabled={isExportingUsers}
        >
          {isExportingUsers ? 'Export en cours...' : 'Export rapports utilisateurs'}
        </Button>
      </div>
      <div className="fr-flex fr-flex-gap-2v" style={{ alignItems: 'stretch' }}>
        <Button
          style={{ flex: 1, width: '300px' }}
          className="fr-flex fr-justify-content-center"
          iconId="ri-folder-chart-line"
          onClick={handleExportSimulations}
          disabled={isExportingSimulations}
        >
          {isExportingSimulations ? 'Export en cours...' : 'Export rapports scénarios'}
        </Button>
        <Button
          style={{ flex: 1, width: '300px' }}
          className="fr-flex fr-justify-content-center"
          iconId="ri-bar-chart-line"
          onClick={handleExportResults}
          disabled={isExportingResults}
        >
          {isExportingResults ? 'Export en cours...' : 'Export résultats'}
        </Button>
      </div>
    </div>
  )
}
