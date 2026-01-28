import { formatNumber } from '~/utils/format-numbers'
import { sPluriel } from '~/utils/sPluriel'

type SimulationVacantsSummaryProps = {
  results: {
    badQuality: number
    total: number
    totalFlux: number
    totalStock: number
    secondaryAccommodation: number
    vacancy: number
  }
  epci?: {
    name: string
    peakYear: number
    prepeakTotalStock: number
    postpeakTotalStock: number
  }
  projection?: number
}

export const SimulationSecondaryVacantsAccommodationsSummary = ({ results, epci, projection }: SimulationVacantsSummaryProps) => {
  const { vacancy, secondaryAccommodation } = results
  const vacantAccomodations = Math.abs(vacancy)
  const scdAccomodations = Math.abs(secondaryAccommodation)

  return (
    <div className="fr-flex fr-justify-content-space-between fr-align-items-center fr-flex-gap-6v">
      <div className="shadow fr-width-full fr-py-8w fr-px-5w fr-background-default--grey fr-justify-content-space-between fr-align-items-center">
        <div className="fr-flex fr-direction-column fr-justify-content-space-between fr-width-full">
          <span className="fr-text-default--grey">
            D'ici <strong>{epci ? epci.peakYear : projection}</strong>, {epci ? `l'EPCI du ${epci.name}` : 'le territoire'} pourra{' '}
            {vacancy < 0 ? 'remobiliser' : 'résorber'}
          </span>
          <span className="fr-text--bold fr-mt-2w fr-h3 fr-mb-0">
            {vacancy < 0 ? formatNumber(vacantAccomodations) : 0} logement{sPluriel(vacantAccomodations)} vacants{' '}
          </span>
        </div>
      </div>
      <div className="shadow fr-width-full fr-py-8w fr-px-5w fr-background-default--grey fr-justify-content-space-between fr-align-items-center">
        <div className="fr-flex fr-direction-column fr-justify-content-space-between fr-width-full">
          <span className="fr-text-default--grey">
            D'ici <strong>{epci ? epci.peakYear : projection}</strong>, {epci ? `l'EPCI du ${epci.name}` : 'le territoire'} pourra{' '}
            {secondaryAccommodation < 0 ? 'résorber' : 'remobiliser'}
          </span>
          <span className="fr-text--bold fr-mt-2w fr-h3 fr-mb-0">
            {formatNumber(scdAccomodations)} résidence{sPluriel(scdAccomodations)} secondaire
          </span>
        </div>
      </div>
    </div>
  )
}
