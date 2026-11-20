import { EstimationBreakdownInput } from '@otelo/shared'
import { amfVariantContributions, buildAmfResult } from './amf-result'

const EPCI = '200040715'

type TOverrides = {
  total?: number
  badHousing?: number
  demographic?: number
  secondary?: number
  shortTerm?: number
  longTerm?: number
}

/** Résultats du moteur sur 14 ans (2022 → 2036), dont le total est la somme des termes. */
const makeResults = (overrides: TOverrides = {}): EstimationBreakdownInput => {
  const demographic = overrides.demographic ?? 2800
  const secondary = overrides.secondary ?? 280
  const shortTerm = overrides.shortTerm ?? 140
  const longTerm = overrides.longTerm ?? -420
  const badHousing = overrides.badHousing ?? 560
  const totalFlux = demographic + secondary + shortTerm + longTerm
  const total = overrides.total ?? totalFlux + badHousing
  return {
    epcisTotals: [{ epciCode: EPCI, total, totalFlux }],
    flowRequirement: {
      epcis: [
        {
          code: EPCI,
          totals: {
            demographicEvolution: demographic,
            renewalNeeds: 0,
            secondaryResidenceAccomodationEvolution: secondary,
            shortTermVacantAccomodation: shortTerm,
            longTermVacantAccomodation: longTerm,
          },
        },
      ],
    },
  }
}

const build = (low: TOverrides, high: TOverrides, secondaryResidences: 'hausse' | 'stable' | 'maitrise' | 'recuperation' = 'hausse') =>
  buildAmfResult(
    amfVariantContributions({ low: makeResults(low), high: makeResults(high) }, { epciCode: EPCI, secondaryResidences }, 2022),
    2022,
  )

describe('buildAmfResult', () => {
  it('annualise chaque contribution sur 2022–2036 et encadre les deux variantes', () => {
    const result = build({}, { demographic: 4200 })
    expect(result.baseYear).toBe(2022)
    expect(result.horizon).toBe(2036)
    expect(result.contributions).toMatchObject({
      households: { min: 200, max: 300 },
      fluidity: 10,
      vacancyRemobilised: { min: 30, max: 30 },
      secondaryResidences: { min: 20, max: 20 },
    })
  })

  it('annualise sur 14 ans le mal-logement déjà proratisé par le moteur', () => {
    // Résorption en 2050 (basse) : 280 logements d'ici 2036 ; en 2040 (haute) : 504.
    expect(build({ badHousing: 280 }, { badHousing: 504 }).contributions?.badHousing).toEqual({ min: 20, max: 36 })
  })

  it('fait la somme des contributions dans le total annuel', () => {
    // 200 + 40 + 10 − 30 + 20 = 240 ; avec 3 220 ménages en haute : 230 + 40 + 10 − 30 + 20 = 270.
    expect(build({}, { demographic: 3220 }).annual).toEqual({ min: 240, max: 270 })
  })

  it('range une vacance longue en hausse avec la fluidité', () => {
    const { contributions } = build({ longTerm: 140 }, { longTerm: 140 })
    expect(contributions?.fluidity).toBe(20)
    expect(contributions?.vacancyRemobilised).toBeNull()
  })

  it('neutralise les résidences secondaires quand elles ne sont pas un enjeu', () => {
    const result = build({}, {}, 'stable')
    expect(result.contributions?.secondaryResidences).toBeNull()
    expect(result.annual).toEqual({ min: 220, max: 220 })
  })

  it('garde une contribution négative calculée par le moteur pour la récupération', () => {
    expect(build({ secondary: -420 }, { secondary: -280 }, 'recuperation').contributions?.secondaryResidences).toEqual({
      min: -30,
      max: -20,
    })
  })

  it('récupère 2 % du besoin quand la baisse du taux ne suffit pas', () => {
    // Besoin hors résidences secondaires : 220 par an, dont 2 % font 4,4.
    expect(build({}, {}, 'recuperation').contributions?.secondaryResidences).toEqual({ min: -4, max: -4 })
  })

  it('renvoie un résultat vide quand le moteur ne retient aucun besoin', () => {
    expect(build({ total: -300 }, { total: 0 })).toEqual({ baseYear: 2022, horizon: 2036, annual: null, contributions: null })
  })

  it('borne le total à 0 quand seule la variante haute dégage un besoin', () => {
    expect(build({ total: -300 }, {}).annual).toEqual({ min: 0, max: 240 })
  })
})
