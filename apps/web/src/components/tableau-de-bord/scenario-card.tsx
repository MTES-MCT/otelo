import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Link from 'next/link'
import { TSimulationWithRelations } from '~/schemas/simulation'
import { CloneSimulationButton } from './clone-simulation-button'
import { DeleteSimulationButton } from './delete-simulation-button'
import { RenameSimulationButton } from './rename-simulation-button'
import styles from './scenario-card.module.css'

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
          <Tooltip title={simulation.name}>
            <span className={styles.scenarioName}>{simulation.name}</span>
          </Tooltip>
        </div>
        <div className={styles.actions}>
          <RenameSimulationButton simulation={simulation} />
          <CloneSimulationButton simulation={simulation} />
          <DeleteSimulationButton simulation={simulation} />
        </div>
      </div>

      <p className={styles.dateText}>Créé le {dayjs(simulation.createdAt).format('DD/MM/YYYY')}</p>

      {!isExpanded && (
        <div className={styles.cardFooter}>
          <span />
          <Link href={resultsHref} className={styles.viewLink}>
            Afficher <span className={classNames('ri-arrow-right-line', styles.arrowIcon)} />
          </Link>
        </div>
      )}
    </div>
  )
}
