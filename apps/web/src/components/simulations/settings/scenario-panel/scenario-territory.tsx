'use client'

import { FC, useState } from 'react'
import styles from './scenario-panel.module.css'

const MAX_EPCIS_DISPLAYED = 2

type ScenarioTerritoryProps = {
  epciNames: string[]
}

/** Le territoire d'étude : les premiers EPCI, et les autres sur demande. */
export const ScenarioTerritory: FC<ScenarioTerritoryProps> = ({ epciNames }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hiddenCount = epciNames.length - MAX_EPCIS_DISPLAYED
  const displayedNames = isExpanded ? epciNames : epciNames.slice(0, MAX_EPCIS_DISPLAYED)

  return (
    <div className={styles.territory}>
      <p className="fr-text--sm fr-text--bold fr-mb-0">{displayedNames.join(', ')}</p>
      {hiddenCount > 0 && (
        <button type="button" className={styles.linkButton} aria-expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Voir moins' : `et ${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
