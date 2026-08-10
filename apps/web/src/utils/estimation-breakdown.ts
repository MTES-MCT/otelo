import { TResults } from '~/schemas/results'

export type EstimationBreakdown = {
  /** Le grand chiffre : logements neufs restant à construire, déductions déjà appliquées. */
  netNeed: number
  /** Besoin avant mobilisation du parc existant. */
  grossNeed: number
  /** Les trois déductions, négatives ou nulles. */
  vacancy: number
  secondary: number
  renewal: number
}

/**
 * `results.total` est déjà net : `NeedsCalculationService` somme la démographie, le mal-logement et
 * les contributions du parc, ces dernières étant négatives quand le parc absorbe une partie du besoin.
 *
 * Le besoin brut est donc reconstitué en réintégrant les déductions, plutôt que recalculé depuis les
 * termes source : la carte s'additionne ainsi toujours, quelle que soit l'évolution du moteur.
 */
export const buildEstimationBreakdown = (results: TResults): EstimationBreakdown => {
  const vacancy = Math.min(0, results.vacantAccomodation)
  const secondary = Math.min(0, results.secondaryAccommodation)
  // Le renouvellement urbain n'existe pas dans les totaux globaux : on l'agrège par EPCI.
  const renewal = results.flowRequirement.epcis.reduce((sum, epci) => sum + Math.min(0, epci.totals.renewalNeeds), 0)

  return {
    netNeed: results.total,
    grossNeed: results.total - vacancy - secondary - renewal,
    vacancy,
    secondary,
    renewal,
  }
}
