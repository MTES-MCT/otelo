import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'
import classNames from 'classnames'
import Link from 'next/link'
import { TSimulationWithRelations } from '~/schemas/simulation'
import { CloneSimulationButton } from './clone-simulation-button'
import { DeleteSimulationButton } from './delete-simulation-button'
import { RenameSimulationButton } from './rename-simulation-button'
import styles from './scenario-card.module.css'
import { SimulationDate } from './simulation-date'

interface ScenarioCardProps {
  simulation: TSimulationWithRelations
  isExpanded: boolean
}

export function ScenarioCard({ simulation, isExpanded }: ScenarioCardProps) {
  const resultsHref = `/simulation/${simulation.id}/resultats`

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.scenarioNameWrapper}>
          <SimulationDate createdAt={simulation.createdAt} updatedAt={simulation.updatedAt} />
        </div>
        <div className={styles.actions}>
          <RenameSimulationButton simulation={simulation} />
          <CloneSimulationButton simulation={simulation} />
          <DeleteSimulationButton simulation={simulation} />
        </div>
      </div>

      <Tooltip title={simulation.name}>
        <span className={styles.scenarioName}>{simulation.name}</span>
      </Tooltip>

      {!isExpanded && (
        <div className={styles.cardFooter}>
          <Link href={resultsHref} className={classNames('fr-link--no-underline', styles.viewLink)}>
            <span>Ouvrir</span>
            <span className={classNames('ri-arrow-right-line', styles.arrowIcon)} />
          </Link>
        </div>
      )}
    </div>
  )
}
