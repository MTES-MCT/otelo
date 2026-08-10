import Button from '@codegouvfr/react-dsfr/Button'
import { SimulationBadHousingDataWrapper } from '~/components/simulations/results/bad-housing/simulation-bad-housing-data-wrapper'
import { SimulationBadHousingDescription } from '~/components/simulations/results/bad-housing/simulation-bad-housing-header'
import { SimulationChartTableSwitch } from '~/components/simulations/results/simulation-chart-table-switch'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'

type SimulationAnnualsNeedsProps = {
  simulationId: string
  horizon: number
  millesime: string
  results: {
    badQuality: number
    financialInadequation: number
    hosted: number
    noAccomodation: number
    physicalInadequation: number
    totalStock: number
  }
}

export const SimulationBadHousing = ({ simulationId, millesime, horizon, results }: SimulationAnnualsNeedsProps) => {
  const { badQuality, financialInadequation, hosted, noAccomodation, physicalInadequation, totalStock } = results
  const chartData = [
    { name: 'Hébergés', value: hosted },
    { name: 'Hors logement', value: noAccomodation },
    { name: 'Inadéquation financière', value: financialInadequation },
    { name: 'Inadéquation physique', value: physicalInadequation },
    { name: 'Mauvaise qualité', value: badQuality },
  ]

  const maxValue = Math.max(...chartData.map((item) => item.value))
  const maxValueName = chartData.find((item) => item.value === maxValue)?.name || ''

  return (
    <div className="fr-background-default--grey shadow" id="mal-logement" {...tutorialAnchor('results-bad-housing')}>
      <div className="fr-py-8w fr-px-5w">
        <div id="bad-housing-evolution" className="fr-flex fr-justify-content-space-between fr-align-items-center">
          <h3 className="fr-h4 fr-mb-0">Situations de mal logement</h3>
          <div className="fr-flex fr-flex-gap-4v fr-align-items-center">
            <Button
              priority="secondary"
              linkProps={{ href: `/simulation/${simulationId}/modifier/mal-logement/horizon-de-resorption` }}
              size="small"
            >
              Affiner le mal-logement
            </Button>
            <span className="fr-text--grey fr-text--sm fr-mb-0">|</span>
            <SimulationChartTableSwitch queryState="mal-logement" />
          </div>
        </div>
        <SimulationBadHousingDescription
          horizon={horizon}
          millesime={millesime}
          totalStock={totalStock}
          maxValue={maxValue}
          maxValueName={maxValueName}
        />
        <SimulationBadHousingDataWrapper chartData={chartData} results={results} horizon={horizon} />
      </div>
    </div>
  )
}
