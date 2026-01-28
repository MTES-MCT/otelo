'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { useState } from 'react'
import { SimulationDemographicParcEvolutionProps } from '~/components/simulations/results/demographic-parc-evolution/simulation-demographic-parc-evolution'
import { formatNumber } from '~/utils/format-numbers'

export const SimulationDemographicParcEvolutionDropdown = ({ results, horizon: _ }: SimulationDemographicParcEvolutionProps) => {
  const {
    demographicEvolution,
    longTermVacantAccomodation,
    renewalNeeds,
    secondaryResidenceAccomodationEvolution,
    shortTermVacantAccomodation,
    vacantAccomodationEvolution,
  } = results
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
            <p className="fr-mb-0">
              Le graphique et le tableau représentent l'influence de la démographie et de l'évolution du parc sur le besoin en constructions
              neuves. Par exemple :
            </p>
            <ul>
              <li>
                L'évolution du nombre de ménages à loger dans le territoire contribue pour {formatNumber(Math.abs(demographicEvolution))} au
                besoin en logements.
              </li>
              <li>
                Pour garder de la fluidité dans le parc de logement, il est nécessaire de produire{' '}
                {formatNumber(shortTermVacantAccomodation)} logements.
              </li>
              <li>
                {secondaryResidenceAccomodationEvolution > 0 && (
                  <>
                    L'évolution du nombre de résidences secondaires contribue à hauteur de&nbsp;
                    {formatNumber(secondaryResidenceAccomodationEvolution)} dans les besoins en constructions neuves, leur nombre augmentant
                    au cours de la période de projection.
                  </>
                )}
                {secondaryResidenceAccomodationEvolution < 0 && (
                  <>
                    L'hypothèse choisie sur les résidences secondaires implique une remobilisation de&nbsp;
                    {formatNumber(Math.abs(secondaryResidenceAccomodationEvolution))} résidences secondaires.
                  </>
                )}

                {secondaryResidenceAccomodationEvolution === 0 && (
                  <>L'hypothèse choisie sur les résidences secondaires n'implique pas de remobilisation de résidences secondaires.</>
                )}
              </li>
              <li>
                {vacantAccomodationEvolution > 0 ? (
                  <>
                    L'hypothèse retenue concernant le taux de vacance induit une augmentation du nombre de logements vacants de&nbsp;
                    {formatNumber(vacantAccomodationEvolution)} au cours de la période de projection, qui se répercute sur le besoin en
                    constructions neuves.
                  </>
                ) : (
                  <>
                    L'hypothèse retenu de baisse de la part des logements vacants de longue durée (&gt;2ans) dans le parc implique la
                    remobilisation de {formatNumber(Math.abs(longTermVacantAccomodation))} logements.
                  </>
                )}
              </li>
              <li>
                Le renouvellement du parc contribue à hauteur de {formatNumber(Math.abs(renewalNeeds))} aux besoins en logements, les&nbsp;
                {renewalNeeds > 0 ? 'disparitions de logements' : 'restructurations de logements'} au sein du parc excédant les&nbsp;
                {renewalNeeds > 0 ? 'restructurations de logements' : 'disparitions de logements'}.
              </li>
            </ul>
          </div>
        </p>
      )}
    </div>
  )
}
