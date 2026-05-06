import classNames from 'classnames'
import Link from 'next/link'
import { dsfrHighlightColors } from '~/components/charts/data-visualisation/colors'
import { SimulationResultPresentationHighlight } from '~/components/simulations/results/simulation-result-presentation-highlight'
import { ColoredEpciData, EpciData, SimulationNeedsSummaryMap } from '~/components/simulations/results/summary/simulation-needs-summary-map'
import { formatNumber } from '~/utils/format-numbers'
import styles from './simulation-needs-summary.module.css'

const fetchEpci = async (epciCode: string): Promise<EpciData | null> => {
  const response = await fetch(`https://geo.api.gouv.fr/epcis/${epciCode}?fields=nom,code,contour`)
  if (!response.ok) return null
  return response.json()
}

type SimulationNeedsSummaryProps = {
  projection: number
  results: {
    badQuality: number
    total: number
    totalFlux: number
    totalStock: number
    secondaryAccommodation: number
    vacancy: number
  }
  epci?: {
    code: string
    name: string
    peakYear: number
    prepeakTotalStock: number
    postpeakTotalStock: number
  }
  epcis?: Array<{
    code: string
    name: string
  }>
}

export const SimulationNeedsSummary = async ({ projection, results, epci, epcis }: SimulationNeedsSummaryProps) => {
  const { total } = results
  const { postpeakTotalStock, peakYear } = epci ?? {}
  const hasNewHousingNeeds = total > 0
  const hasNewHousingNeedsTitle = epci ? `L'EPCI du ${epci.name}` : 'Votre territoire'
  const noNewHousingNeedsTitle = epci ? (
    <>
      l'EPCI du <span className="fr-text--bold">{epci.name}</span>
    </>
  ) : (
    <span className="fr-text--bold">votre territoire</span>
  )

  let epciData: EpciData | null = null
  let epciDataList: ColoredEpciData[] | undefined

  if (epci) {
    epciData = await fetchEpci(epci.code)
  } else if (epcis && epcis.length > 0) {
    const epciDataResults = await Promise.all(epcis.map((e) => fetchEpci(e.code)))

    epciDataList = epciDataResults
      .filter((data): data is EpciData => data !== null)
      .map((data, index) => ({
        ...data,
        color: dsfrHighlightColors[index % dsfrHighlightColors.length],
      }))
  }

  const showMap = (epci && epciData) || (epciDataList && epciDataList.length > 0)

  return (
    <>
      <div className="fr-background-default--grey shadow fr-flex fr-justify-content-space-between fr-align-items-center">
        <div className="fr-col-md-6 fr-py-8w fr-px-5w">
          {hasNewHousingNeeds && (
            <div className="fr-flex fr-direction-column">
              <span className="fr-text-default--grey">{hasNewHousingNeedsTitle} devra construire</span>
              <span className={classNames({ 'fr-mb-0': !epci }, 'fr-text--bold fr-h2 fr-mt-1v')}>
                {formatNumber(total)} logements neufs
              </span>
            </div>
          )}
          {!hasNewHousingNeeds && (
            <div className="fr-flex fr-direction-column">
              <span className="fr-text-default--grey fr-text--lg">
                Les évolutions démographiques, conjuguées aux hypothèses d'évolution du parc de logements, ne génèrent pas de besoin en
                construction neuve sur {noNewHousingNeedsTitle}.
              </span>
            </div>
          )}
          {!!epci && epci.peakYear < projection && postpeakTotalStock && (
            <div className="fr-mb-2w">
              {peakYear === 2021 ? (
                <p className="fr-text--sm">
                  Le scénario démographique choisi conduit le territoire à atteindre son pic de ménages dès&nbsp;
                  <span className="fr-text--bold">{peakYear}</span>. La production d’une offre de logements neufs à partir de cette date
                  n’est donc plus indispensable, à condition que les besoins résiduels liés au mal-logement trouvent une réponse via la
                  mobilisation du parc existant.
                </p>
              ) : (
                <p className="fr-text--sm fr-mb-0">
                  Le scénario démographique choisi conduit le territoire à atteindre son pic de ménages en&nbsp;
                  <span className="fr-text--bold">{peakYear}</span>. Au regard des hypothèses retenues, ni les évolutions du parc et de son
                  occupation, ni la résorption des situations de mal-logement (
                  <span className="fr-text--bold">{formatNumber(postpeakTotalStock!)}</span> situations à résoudre) ne rendent indispensable
                  la production d’une offre de logements neufs, à la condition que les besoins associés à ces situations trouvent une
                  réponse via la mobilisation du parc existant.
                </p>
              )}
              <span className="fr-text--sm">
                {epci.peakYear + 1 === projection
                  ? `En ${projection}, il restera `
                  : `Sur la période ${epci.peakYear + 1} à ${projection}, il restera `}
                <span className="fr-text--bold">{formatNumber(postpeakTotalStock)}</span> logements à trouver pour résorber le mal-logement.
              </span>
            </div>
          )}
          {!!epci && (
            <Link className="fr-link" href="#besoin-annualise">
              Voir le besoin annualisé
              <span className={classNames(styles.arrowIcon, 'fr-ml-1w ri-arrow-right-line')} />
            </Link>
          )}
          <SimulationResultPresentationHighlight>
            <div className="fr-mt-4w">
              Aliquip in voluptate occaecat commodo laboris laboris dolore ut in proident non nisi ut. Mollit dolore dolor aliqua esse.
              Minim enim aliquip eu ut qui exercitation est eu commodo ut proident ad. Eu labore eiusmod aliqua cillum exercitation.
            </div>
          </SimulationResultPresentationHighlight>
        </div>
        {showMap && (
          <div className="fr-col-md-6">
            <SimulationNeedsSummaryMap epciData={epciData} epciDataList={epciDataList} />
          </div>
        )}
      </div>
    </>
  )
}
