'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { useState } from 'react'

export const SimulationVacantsDropdownSummary = () => {
  const [isShown, setIsShown] = useState(false)
  return (
    <div className="fr-border-top fr-p-3v fr-flex fr-direction-column fr-justify-content-space-between">
      <Button
        onClick={() => setIsShown(!isShown)}
        priority="tertiary no outline"
        className="fr-width-full fr-flex fr-justify-content-space-between"
      >
        <span className="fr-text-title--blue-france fr-text--medium">Pourquoi remobiliser ?</span>
        <span
          className={classNames(
            'fr-text-title--blue-france fr-text--medium',
            isShown ? 'ri-arrow-drop-up-line' : 'ri-arrow-drop-down-line',
          )}
        />
      </Button>
      {isShown && (
        <p className="fr-mb-2w fr-mt-3v fr-px-2w">
          La remobilisation des logements vacants et des résidences secondaires permet de répondre aux besoins en logement tout en limitant
          la construction neuve. Cette démarche contribue directement à l'objectif de sobriété foncière en préservant les terres agricoles
          et naturelles. En valorisant le parc existant, le territoire réduit son artificialisation des sols et s'inscrit dans une logique
          d'aménagement durable et responsable.
        </p>
      )}
    </div>
  )
}
