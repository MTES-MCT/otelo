'use client'

import { RiIconClassName } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { useQueryState } from 'nuqs'
import styles from './simulation-chart-table-switch.module.css'

type SimulationChartTableSwitchProps = {
  queryState: 'demographie' | 'mal-logement'
}

export const SimulationChartTableSwitch = ({ queryState }: SimulationChartTableSwitchProps) => {
  const segments = [
    {
      id: 'graphique' as const,
      name: 'Graphique',
      iconId: 'ri-line-chart-line' as RiIconClassName,
    },
    {
      id: 'tableau' as const,
      name: 'Tableau',
      iconId: 'ri-table-view' as RiIconClassName,
    },
  ]
  const [demographicSegment, setDemographicSegment] = useQueryState(queryState, { defaultValue: 'graphique' })

  return (
    <div className="fr-flex fr-flex-gap-4v fr-align-items-center">
      <div>
        {segments.map((segment) => (
          <Button
            key={segment.id}
            className="fr-border-radius--4"
            priority={segment.id === demographicSegment ? 'secondary' : 'tertiary'}
            size="small"
            onClick={() => setDemographicSegment(segment.id)}
          >
            <span className={classNames(styles.icon, segment.iconId, 'fr-mr-1v')} aria-hidden />
            {segment.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
