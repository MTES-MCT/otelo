'use client'

import { useConnectedUsers } from '~/hooks/use-connected-users'

export function ConnectedUsersBadge({ simulationId }: { simulationId: string }) {
  const { count } = useConnectedUsers(simulationId)

  if (count <= 0) return null

  const isMultiple = count > 1

  return (
    <span
      className={`fr-badge fr-badge--sm fr-badge--no-icon ${isMultiple ? 'fr-badge--success' : 'fr-badge--info'}`}
      title={isMultiple ? `${count} utilisateurs connectés` : 'Vous êtes le seul connecté'}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isMultiple ? 'var(--background-flat-success)' : 'currentColor',
          display: 'inline-block',
          marginRight: 6,
        }}
      />
      {isMultiple ? `${count} connectés` : '1 connecté'}
    </span>
  )
}
