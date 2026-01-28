import { SimulationBadHousingDataWrapper } from '~/components/simulations/results/bad-housing/simulation-bad-housing-data-wrapper'
import { SimulationBadHousingDescription } from '~/components/simulations/results/bad-housing/simulation-bad-housing-header'
import { SimulationChartTableSwitch } from '~/components/simulations/results/simulation-chart-table-switch'

type SimulationAnnualsNeedsProps = {
  horizon: number
  results: {
    badQuality: number
    financialInadequation: number
    hosted: number
    noAccomodation: number
    physicalInadequation: number
    totalStock: number
  }
}

export const SimulationBadHousing = ({ horizon, results }: SimulationAnnualsNeedsProps) => {
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
    <div className="fr-background-default--grey shadow" id="mal-logement">
      <div className="fr-py-8w fr-px-5w">
        <div id="demographique-parc-evolution" className="fr-flex fr-justify-content-space-between fr-align-items-center">
          <h3 className="fr-h4 fr-mb-0">Situations de mal logement</h3>
          <SimulationChartTableSwitch queryState="mal-logement" />
        </div>
        <SimulationBadHousingDescription horizon={horizon} totalStock={totalStock} maxValue={maxValue} maxValueName={maxValueName} />
        <SimulationBadHousingDataWrapper chartData={chartData} results={results} horizon={horizon} />
      </div>
    </div>
  )
}
