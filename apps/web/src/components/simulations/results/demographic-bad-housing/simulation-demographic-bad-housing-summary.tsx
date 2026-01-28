import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import Link from 'next/link'
import { SimulationDemographicBadHousingChartSummary } from '~/components/simulations/results/demographic-bad-housing/simulation-demographic-bad-housing-chart-summary'
import { SimulationResultPresentationHighlight } from '~/components/simulations/results/simulation-result-presentation-highlight'
import { formatNumber } from '~/utils/format-numbers'
import styles from './simulation-demographic-bad-housing-summary.module.css'

type SimulationDemographicBadHousingSummaryProps = {
  simulationId: string
  totalFlux: number
  totalStock: number
  epci?: {
    name: string
    peakYear: number
    prepeakTotalStock: number
    postpeakTotalStock: number
  }
}

export const SimulationDemographicBadHousingSummary = ({
  simulationId,
  totalFlux,
  epci,
  totalStock,
}: SimulationDemographicBadHousingSummaryProps) => {
  const hasNewHousingNeeds = totalFlux > 0
  const { prepeakTotalStock } = epci ?? {}

  // Calculate chevron positions: centered on their chart section but constrained within their card
  const badHousingValue = epci && prepeakTotalStock ? prepeakTotalStock : totalStock
  const demographyPercent = totalFlux > 0 ? ((totalFlux - badHousingValue) / totalFlux) * 100 : 50
  const badHousingPercent = 100 - demographyPercent
  // Left chevron: center of demography section, but max 45% (stays under left card)
  const leftChevronPosition = Math.min(demographyPercent / 2, 45)
  // Right chevron: center of bad housing section, but min 52% (stays under right card)
  const rightChevronPosition = Math.max(demographyPercent + badHousingPercent / 2, 52)

  return (
    <div className="fr-background-default--grey fr-flex fr-direction-column fr-py-8w fr-px-5w shadow">
      <h3 className="fr-h4">À quels besoins répondront ces logements ?</h3>

      <SimulationDemographicBadHousingChartSummary totalFlux={totalFlux} totalStock={totalStock} epci={epci} />

      {hasNewHousingNeeds && (
        <div className={styles.chevronContainer}>
          <div className={styles.chevronWrapper} style={{ left: `${leftChevronPosition}%` }}>
            <div className={classNames(styles.chevron, styles.chevronDemography)} />
          </div>
          <div className={styles.chevronWrapper} style={{ left: `${rightChevronPosition}%` }}>
            <div className={classNames(styles.chevron, styles.chevronBadHousing)} />
          </div>
        </div>
      )}

      <div className="fr-flex fr-direction-column fr-direction-sm-row fr-justify-content-space-between fr-flex-gap-8v">
        {hasNewHousingNeeds && (
          <div className="fr-border fr-p-4w fr-flex fr-direction-column fr-width-full">
            <span className="fr-text--medium fr-text--lg fr-mb-0">Démographie et évolution du parc</span>
            <span className="fr-h4 fr-text-title--blue-france fr-mt-1v fr-mb-0">{formatNumber(totalFlux)} logements</span>
            <div className="fr-my-2w">
              <SimulationResultPresentationHighlight>
                Aliquip in voluptate occaecat commodo laboris laboris dolore ut in proident non nisi ut. Mollit dolore dolor aliqua esse.
                Minim enim aliquip eu ut qui exercitation est eu commodo ut proident ad. Eu labore eiusmod aliqua cillum exercitation.
              </SimulationResultPresentationHighlight>
            </div>
            <div className="fr-flex fr-direction-column fr-direction-sm-row fr-flex-gap-2v fr-justify-content-space-between fr-align-items-center">
              <Button priority="secondary" linkProps={{ href: `/simulation/${simulationId}/modifier/cadrage-temporel` }} size="small">
                Modifier les hypothèses
              </Button>
              <div>
                <Link className="fr-link" href="#demographie-parc">
                  Voir le détail
                  <span className={classNames(styles.arrowIcon, 'fr-ml-1w ri-arrow-right-line')} />
                </Link>
              </div>
            </div>
          </div>
        )}
        <div className="fr-border fr-p-4w fr-flex fr-direction-column fr-width-full">
          <span className="fr-text--medium fr-text--lg fr-mb-0">Ménages en situation de mal logement</span>
          <span className="fr-h4 fr-text-title--blue-france fr-mt-1v fr-mb-0">
            {!!epci && prepeakTotalStock ? formatNumber(prepeakTotalStock) : formatNumber(totalStock)} logements
          </span>
          <div className="fr-my-2w">
            <SimulationResultPresentationHighlight>
              Aliquip in voluptate occaecat commodo laboris laboris dolore ut in proident non nisi ut. Mollit dolore dolor aliqua esse.
              Minim enim aliquip eu ut qui exercitation est eu commodo ut proident ad. Eu labore eiusmod aliqua cillum exercitation.
            </SimulationResultPresentationHighlight>
          </div>
          <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-direction-sm-row fr-justify-content-space-between fr-align-items-center">
            <Button
              priority="secondary"
              linkProps={{ href: `/simulation/${simulationId}/modifier/mal-logement/horizon-de-resorption` }}
              size="small"
            >
              Affiner le mal-logement
            </Button>
            <div>
              <Link className="fr-link" href="#mal-logement">
                Voir le détail
                <span className={classNames(styles.arrowIcon, 'fr-ml-1w ri-arrow-right-line')} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
