'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useExportSimulationsStatistics } from '~/hooks/use-export-simulations-statistics'
import { useExportUsersStatistics } from '~/hooks/use-export-users-statistics'

export default function StatisticsExportButtons() {
  const { isPending: isExportingUsers, mutateAsync: exportUsersStatistics } = useExportUsersStatistics()
  const { isPending: isExportingSimulations, mutateAsync: exportSimulationsStatistics } = useExportSimulationsStatistics()

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

  return (
    <div className="fr-flex fr-flex-gap-2v">
      <div>
        <Button iconId="ri-user-line" onClick={handleExportUsers} disabled={isExportingUsers}>
          {isExportingUsers ? 'Export en cours...' : 'Export rapports utilisateurs'}
        </Button>
      </div>
      <div>
        <Button iconId="ri-folder-chart-line" onClick={handleExportSimulations} disabled={isExportingSimulations}>
          {isExportingSimulations ? 'Export en cours...' : 'Export rapports scénarios'}
        </Button>
      </div>
    </div>
  )
}
