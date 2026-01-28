import Button from '@codegouvfr/react-dsfr/Button'
import Tag from '@codegouvfr/react-dsfr/Tag'
import dayjs from 'dayjs'
import Link from 'next/link'
import { TSimulationWithRelations } from '~/schemas/simulation'
import { CloneSimulationButton } from './clone-simulation-button'
import { DeleteSimulationButton } from './delete-simulation-button'

interface DashboardSimulationItemProps {
  simulation: TSimulationWithRelations
}

export function DashboardSimulationItem({ simulation }: DashboardSimulationItemProps) {
  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-3v">
      <div className="fr-flex fr-flex-gap-2v fr-direction-column">
        <div className="fr-flex fr-align-items-center fr-justify-content-space-between">
          <Tag className="fr-text--xs fr-mb-0">2021 → {simulation.scenario.projection}</Tag>
          <div className="fr-grid-row fr-grid-row--middle">
            <div className="fr-grid-row fr-grid-row--middle">
              <CloneSimulationButton simulation={simulation} />
              <DeleteSimulationButton simulation={simulation} />
            </div>
          </div>
        </div>
        <div>
          Scénario&nbsp;
          <Link href={`/simulation/${simulation.id}/resultats`} className="fr-link fr-link--no-underline fr-text--bold">
            {simulation.name}
          </Link>
        </div>
      </div>
      <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
        <span className="fr-text--xs fr-mb-0 fr-text-mention--grey">Modifié le {dayjs(simulation.updatedAt).format('DD/MM/YYYY')}</span>
        <Button
          iconId="ri-arrow-right-line"
          priority="tertiary no outline"
          linkProps={{ href: `/simulation/${simulation.id}/resultats` }}
          title="Accéder aux résultats"
          size="small"
        />
      </div>
    </div>
  )
}
