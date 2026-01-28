'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { useState } from 'react'

export const SimulationAnnualsNeedsDropdownSummary = ({ horizon, hasSurplusHousing }: { horizon: number; hasSurplusHousing: boolean }) => {
  const [isShown, setIsShown] = useState(false)
  return (
    <div className="fr-border-top fr-p-3v fr-flex fr-direction-column fr-justify-content-space-between">
      <Button
        onClick={() => setIsShown(!isShown)}
        priority="tertiary no outline"
        className="fr-width-full fr-flex fr-justify-content-space-between"
      >
        <span className="fr-text-title--blue-france fr-text--medium">Clé de lecture</span>
        <span
          className={classNames(
            'fr-text-title--blue-france fr-text--medium',
            isShown ? 'ri-arrow-drop-up-line' : 'ri-arrow-drop-down-line',
          )}
        />
      </Button>
      {isShown && (
        <p className="fr-mb-2w fr-mt-3v fr-px-2w">
          <div>
            <ul>
              <li>
                <span className="fr-text--bold">Besoins en logements (barres rouges)</span> : volume estimé de logements à construire chaque
                année pour répondre aux dynamiques démographiques, aux situations de mal-logement (partiellement traduites en besoins
                neufs). Ces besoins sont projetés jusqu’en {horizon}.
              </li>
              {hasSurplusHousing && (
                <li>
                  <span className="fr-text--bold">Logements excédentaires (barres jaunes)</span> : représentent les résidences principales
                  devenant vacants ou résidences secondaires, à partir des années où le besoin en construction est nul.
                </li>
              )}
              <li>
                <span className="fr-text--bold">Permis de construire autorisés (barres bleues)</span> : nombre d’autorisations de
                constructions d’après Sit@del2.
              </li>
              <li>
                <span className="fr-text--bold">Logements commencés (barres vertes)</span> : Nombre de logements commencés d'après Sit@del2
              </li>
            </ul>
          </div>
        </p>
      )}
    </div>
  )
}
