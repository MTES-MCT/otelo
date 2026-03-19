'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { useMemo } from 'react'
import { type ActivityEntry, useActivityHistory } from '~/hooks/use-activity-history'
import dayjs from '~/lib/dayjs'
import { ScenarioDiffDetails } from './scenario-diff-details'

const ACTION_LABELS: Record<string, { icon: string; label: string }> = {
  scenario_updated: { icon: 'ri-edit-line', label: 'Scénario modifié' },
  simulation_deleted: { icon: 'ri-delete-bin-line', label: 'Simulation supprimée' },
  collaborator_invited: { icon: 'ri-user-add-line', label: 'Collaborateur invité' },
  collaborator_removed: { icon: 'ri-user-unfollow-line', label: 'Collaborateur retiré' },
}

function ActivityItem({ activity }: { activity: ActivityEntry }) {
  const actionInfo = ACTION_LABELS[activity.action] ?? { icon: 'ri-information-line', label: activity.action }

  const parsedDiff = useMemo(() => {
    if (!activity.details) return null
    try {
      const parsed = JSON.parse(activity.details)
      return parsed?.type === 'scenario_diff' ? parsed : null
    } catch {
      return null
    }
  }, [activity.details])

  return (
    <li className="fr-flex fr-flex-gap-2v fr-py-1v">
      <span className={`${actionInfo.icon} fr-mt-1v`} style={{ fontSize: '1rem', flexShrink: 0 }} />
      <div className="fr-flex-grow-1">
        <div className={fr.cx('fr-text--sm', 'fr-mb-0')}>
          <span className={fr.cx('fr-text--bold')}>
            {activity.user.firstname} {activity.user.lastname}
          </span>{' '}
          &mdash; {actionInfo.label}
        </div>
        {parsedDiff ? (
          <ScenarioDiffDetails diff={parsedDiff} />
        ) : (
          activity.details && <div className={fr.cx('fr-text--xs', 'fr-mb-0')}>{activity.details}</div>
        )}
        <div className={fr.cx('fr-text--xs', 'fr-mb-0')} style={{ opacity: 0.6 }}>
          {dayjs(activity.createdAt).fromNow()} &middot; {dayjs(activity.createdAt).format('DD/MM/YYYY HH:mm')}
        </div>
      </div>
    </li>
  )
}

export function ActivityHistoryPanel({ simulationId }: { simulationId: string }) {
  const { activities, isLoading } = useActivityHistory(simulationId)

  const modalActions = useMemo(
    () =>
      createModal({
        id: `activity-history-modal-${simulationId}`,
        isOpenedByDefault: false,
      }),
    [simulationId],
  )

  return (
    <>
      <Button iconId="ri-history-line" onClick={modalActions.open} priority="tertiary" size="small">
        Historique
      </Button>

      <modalActions.Component title="Historique des modifications" concealingBackdrop>
        {isLoading ? (
          <p className={fr.cx('fr-text--sm')}>Chargement...</p>
        ) : activities.length > 0 ? (
          <ul className="fr-raw-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        ) : (
          <p className={fr.cx('fr-text--sm', 'fr-mt-2w')}>Aucune activité pour le moment.</p>
        )}
      </modalActions.Component>
    </>
  )
}
