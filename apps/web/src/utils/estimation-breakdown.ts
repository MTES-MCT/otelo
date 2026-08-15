import { TResults } from '~/schemas/results'

/** Les neuf termes du besoin, dans l'ordre de lecture de la carte d'estimation (A → I). */
export type EstimationTermKey =
  /** A — évolution du nombre de ménages */
  | 'demographic'
  /** B — situations de mal-logement générant un besoin en logements supplémentaires */
  | 'badHousing'
  /** C — maintien de la fluidité du parc */
  | 'fluidity'
  /** D — augmentation des logements vacants de longue durée */
  | 'vacancyIncrease'
  /** E — augmentation des résidences secondaires */
  | 'secondaryIncrease'
  /** F — disparition de logements excédant les apparitions */
  | 'disappearanceSurplus'
  /** G — remobilisation de logements vacants de longue durée */
  | 'vacancyRemobilised'
  /** H — diminution du nombre de résidences secondaires */
  | 'secondaryDecrease'
  /** I — apparition de logements excédant les disparitions */
  | 'appearanceSurplus'

/** Tous les termes sont positifs ou nuls : G, H et I sont des volumes mobilisables, pas des déductions signées. */
export type EstimationBreakdown = Record<EstimationTermKey, number>

/**
 * Décompose `results` en ses neuf termes, de sorte que `(A+B+C+D+E+F) − (G+H+I) === results.total`.
 *
 * Deux précautions gouvernent ce calcul :
 *
 * 1. **Seuls les EPCI qui alimentent le total sont comptés.** `NeedsCalculationService` écarte du
 *    total ceux dont le besoin de constructions neuves est négatif — sommer `flowRequirement` sur
 *    tous les EPCI, ou reprendre `results.totalStock` (accumulé lui sans ce filtre), ferait diverger
 *    la carte de son propre total. Le critère est `epcisTotals[].total > 0`, cette valeur étant
 *    précisément le besoin de constructions neuves de l'EPCI.
 * 2. **Le découpage des termes signés se fait par EPCI, avant la somme.** Vacance de longue durée,
 *    résidences secondaires et renouvellement créent un besoin quand ils sont positifs et libèrent du
 *    parc quand ils sont négatifs : un territoire peut faire les deux à la fois selon l'EPCI, ce
 *    qu'une somme préalable effacerait.
 *
 * Le mal-logement (B) se déduit alors de `total − totalFlux`, c'est-à-dire la part de stock que le
 * moteur a effectivement retenue pour cet EPCI.
 */
export const buildEstimationBreakdown = (results: TResults): EstimationBreakdown => {
  const breakdown: EstimationBreakdown = {
    appearanceSurplus: 0,
    badHousing: 0,
    demographic: 0,
    disappearanceSurplus: 0,
    fluidity: 0,
    secondaryDecrease: 0,
    secondaryIncrease: 0,
    vacancyIncrease: 0,
    vacancyRemobilised: 0,
  }

  for (const epciTotals of results.epcisTotals) {
    if (epciTotals.total <= 0) continue

    breakdown.badHousing += epciTotals.total - epciTotals.totalFlux

    const totals = results.flowRequirement.epcis.find((epci) => epci.code === epciTotals.epciCode)?.totals
    if (!totals) continue

    breakdown.demographic += totals.demographicEvolution
    breakdown.fluidity += totals.shortTermVacantAccomodation

    breakdown.vacancyIncrease += Math.max(0, totals.longTermVacantAccomodation)
    breakdown.vacancyRemobilised += -Math.min(0, totals.longTermVacantAccomodation)

    breakdown.secondaryIncrease += Math.max(0, totals.secondaryResidenceAccomodationEvolution)
    breakdown.secondaryDecrease += -Math.min(0, totals.secondaryResidenceAccomodationEvolution)

    breakdown.disappearanceSurplus += Math.max(0, totals.renewalNeeds)
    breakdown.appearanceSurplus += -Math.min(0, totals.renewalNeeds)
  }

  return breakdown
}
