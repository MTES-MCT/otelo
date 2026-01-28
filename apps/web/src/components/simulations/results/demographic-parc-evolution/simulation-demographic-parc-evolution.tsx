import { SimulationParcEvolutionDataWrapper } from '~/components/simulations/results/demographic-parc-evolution/simulation-demographic-parc-evolution-data-wrapper'
import { SimulationChartTableSwitch } from '~/components/simulations/results/simulation-chart-table-switch'

export type SimulationDemographicParcEvolutionProps = {
  results: {
    demographicEvolution: number
    renewalNeeds: number
    secondaryResidenceAccomodationEvolution: number
    totalFlux: number
    vacantAccomodationEvolution: number
    shortTermVacantAccomodation: number
    longTermVacantAccomodation: number
  }
  horizon: number
}

export const SimulationDemographicParcEvolution = ({ results, horizon }: SimulationDemographicParcEvolutionProps) => {
  return (
    <div className="fr-background-default--grey shadow" id="demographie-parc">
      <div className="fr-py-8w fr-px-5w">
        <div id="demographique-parc-evolution" className="fr-flex fr-justify-content-space-between fr-align-items-center">
          <h3 className="fr-h4 fr-mb-0">Démographie et évolution du parc</h3>
          <SimulationChartTableSwitch queryState="demographie" />
        </div>
        <p className="fr-mt-2w">
          Le graphique représente l'influence de la démographie et de l'évolution du parc sur le besoin en constructions neuves.
        </p>
        <SimulationParcEvolutionDataWrapper results={results} horizon={horizon} />
      </div>
      {/* <SimulationDemographicParcEvolutionDropdown results={results} horizon={horizon} /> */}
    </div>
  )
}
