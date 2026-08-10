import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { EpcisDetailsTable } from '~/components/table/epcis-details-table'
import { TSimulationWithResults } from '~/schemas/simulation'

export const SimulationEpcisDetails = ({ simulation }: { simulation: TSimulationWithResults }) => {
  return (
    <div className="fr-background-default--grey shadow" id="mal-logement" {...tutorialAnchor('results-epcis-details')}>
      <div className="fr-py-8w fr-px-5w">
        <EpcisDetailsTable simulation={simulation} />
      </div>
    </div>
  )
}
