'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useSearchParams } from 'next/navigation'

export const SimulationHeaderSegmentedControls = ({
  segments,
  activeId,
}: {
  segments: Array<{ id: string; name: string }>
  activeId: string
}) => {
  const searchParams = useSearchParams()

  return (
    <div className="fr-flex fr-flex-gap-4v fr-align-items-center">
      <span className="fr-text--sm fr-mb-0 ">Scénario affiché</span>
      <div>
        {segments.map((segment) => (
          <Button
            key={segment.id}
            linkProps={{
              href: `/simulation/${segment.id}/resultats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
            }}
            priority={segment.id === activeId ? 'secondary' : 'tertiary'}
            size="small"
            className="fr-border-radius--4"
          >
            {segment.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
