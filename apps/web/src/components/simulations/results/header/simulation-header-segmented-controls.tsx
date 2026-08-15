'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useSearchParams } from 'next/navigation'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { useTracking } from '~/hooks/use-tracking'

export const SimulationHeaderSegmentedControls = ({
  segments,
  activeId,
}: {
  segments: Array<{ id: string; name: string }>
  activeId: string
}) => {
  const searchParams = useSearchParams()
  const { trackEvent } = useTracking()

  return (
    <div className="fr-flex fr-flex-gap-4v fr-align-items-center" {...tutorialAnchor('results-scenarios')}>
      <span className="fr-text--sm fr-mb-0 ">Scénario affiché</span>
      <div>
        {segments.map((segment) => (
          <Button
            key={segment.id}
            linkProps={{
              href: `/simulation/${segment.id}/resultats${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
              // R1 — la comparaison de scénarios est le cœur de la valeur du produit,
              // et rien en base ne distingue « a créé plusieurs scénarios » de
              // « les a réellement comparés ».
              onClick: () => trackEvent({ action: 'comparaison scenarios', category: 'Simulation', value: segments.length }),
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
