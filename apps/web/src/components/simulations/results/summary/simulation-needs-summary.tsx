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
  const title = epci ? `L'EPCI du ${epci.name}` : 'Votre territoire'

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

  // if (!hasNewHousingNeeds) return null

  return (
    <>
      <div className="fr-background-default--grey shadow fr-flex fr-justify-content-space-between fr-align-items-center">
        <div className="fr-col-md-6 fr-py-8w fr-px-5w">
          {hasNewHousingNeeds && (
            <div className="fr-flex fr-direction-column">
              <span className="fr-text-default--grey">{title} devra construire</span>
              <span className={classNames({ 'fr-mb-0': !epci }, 'fr-text--bold fr-h2 fr-mt-1v')}>
                {formatNumber(total)} logements neufs
              </span>
            </div>
          )}
          {!!epci && epci.peakYear < projection && postpeakTotalStock && (
            <div className="fr-mb-2w">
              {peakYear === 2021 ? (
                <p className="fr-text--sm">
                  Dans le scénario démographique choisi, le territoire atteint son pic de ménages dès{' '}
                  <span className="fr-text--bold">{peakYear}</span> : il n’y a donc plus de besoins en logements supplémentaires liés à la
                  démographie ou à l’évolution du parc. Les besoins restant concernent la résorption des situations de mal-logement, qui
                  implique de produire (construction neuve ou transformation du parc existant) des logements spécifiquement pour les ménages
                  concernés.
                </p>
              ) : (
                <p className="fr-text--sm fr-mb-0">
                  Une fois la croissance démographique stabilisée en <span className="fr-text--bold">{peakYear}</span>, le territoire n’a
                  plus besoin de construire davantage, mais doit encore agir pour améliorer les conditions de logement des ménages les plus
                  fragiles.
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
