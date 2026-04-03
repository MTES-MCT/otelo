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
  renewalNeeds?: number
  epci?: {
    name: string
    peakYear: number
    prepeakTotalStock: number
    postpeakTotalStock: number
  }
  projection?: number
}

export const SimulationSecondaryVacantsAccommodationsSummary = ({
  results,
  renewalNeeds,
  epci,
  projection,
}: SimulationVacantsSummaryProps) => {
  const { vacancy, secondaryAccommodation } = results
  const vacantAccomodations = Math.abs(vacancy)
  const scdAccomodations = Math.abs(secondaryAccommodation)
  const absRenewalNeeds = Math.abs(renewalNeeds ?? 0)
  const peakYear = epci && epci.peakYear

  if (peakYear === 2021) {
    return null
  }

  return (
    <>
      <p className="fr-text--lg fr-text--bold fr-mb-0">
        Le parc actuel pourrait répondre à une partie de la demande en nouveaux logements :
      </p>
      <div className="fr-flex fr-justify-content-space-between fr-align-items-stretch fr-flex-gap-6v">
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
              {secondaryAccommodation < 0 ? formatNumber(scdAccomodations) : 0} résidence{sPluriel(scdAccomodations)} secondaires
            </span>
          </div>
        </div>
        {!!renewalNeeds && renewalNeeds < 0 && (
          <div className="shadow fr-width-full fr-py-8w fr-px-5w fr-background-default--grey fr-justify-content-space-between fr-align-items-center">
            <div className="fr-flex fr-direction-column fr-justify-content-space-between fr-width-full">
              <span className="fr-text-default--grey">
                D'ici <strong>{epci ? epci.peakYear : projection}</strong>, le rythme retenu de renouvellement urbain pourrait permettre de
                créer
              </span>
              <span className="fr-text--bold fr-mt-2w fr-h3 fr-mb-0">
                {formatNumber(absRenewalNeeds)} logement{sPluriel(absRenewalNeeds)}
              </span>
              <span className="fr-text-default--grey fr-mt-2w">via la restructuration (transformation, division de logements)</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
