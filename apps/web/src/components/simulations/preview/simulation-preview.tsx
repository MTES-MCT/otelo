'use client'

import { FC } from 'react'
import { tss } from 'tss-react'
import { SimulationPreviewPayload, useSimulationPreview } from '~/hooks/use-simulation-preview'

interface SimulationPreviewProps {
  payload: SimulationPreviewPayload
  enabled?: boolean
  title?: string
}

export const SimulationPreview: FC<SimulationPreviewProps> = ({ payload, enabled = true, title = 'Aperçu calcul (debug)' }) => {
  const { classes } = useStyles()
  const { data, isLoading, isFetching, error } = useSimulationPreview(payload, { enabled })

  return (
    <details className={classes.container}>
      <summary className={classes.summary}>
        {title} {(isLoading || isFetching) && <span className={classes.status}>— calcul…</span>}
      </summary>
      {error ? (
        <pre className={classes.error}>{String(error instanceof Error ? error.message : error)}</pre>
      ) : (
        <pre className={classes.pre}>{data ? JSON.stringify(data, null, 2) : 'Aucun résultat pour le moment.'}</pre>
      )}
    </details>
  )
}

const useStyles = tss.create({
  container: {
    backgroundColor: 'var(--background-alt-grey)',
    border: '1px solid var(--border-default-grey)',
    marginTop: '1rem',
    padding: '0.75rem 1rem',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 600,
  },
  status: {
    color: 'var(--text-mention-grey)',
    fontWeight: 400,
  },
  pre: {
    backgroundColor: 'var(--background-default-grey)',
    fontSize: '0.75rem',
    marginTop: '0.5rem',
    maxHeight: '400px',
    overflow: 'auto',
    padding: '0.5rem',
    whiteSpace: 'pre-wrap',
  },
  error: {
    color: 'var(--text-default-error)',
    marginTop: '0.5rem',
  },
})
