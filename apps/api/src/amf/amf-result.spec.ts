import { EstimationBreakdownInput } from '@otelo/shared'
import { buildAmfResult } from './amf-result'

const EPCI = '200040715'

const makeResults = (overrides: { total?: number; totalFlux?: number; longTermVacant?: number } = {}) =>
  ({
    total: overrides.total ?? 4817,
    epcisTotals: [{ epciCode: EPCI, total: overrides.total ?? 4817, totalFlux: overrides.totalFlux ?? 3600 }],
    flowRequirement: {
      epcis: [
        {
          code: EPCI,
          totals: {
            demographicEvolution: 3900,
            renewalNeeds: -150,
            secondaryResidenceAccomodationEvolution: 203,
            shortTermVacantAccomodation: 147,
            longTermVacantAccomodation: overrides.longTermVacant ?? -500,
          },
        },
      ],
    },
  }) satisfies EstimationBreakdownInput & { total: number }

describe('buildAmfResult', () => {
  it('arrondit le total à la dizaine et calcule la moyenne annuelle', () => {
    const result = buildAmfResult(makeResults(), EPCI, 2022)
    expect(result.total).toBe(4820)
    expect(result.annualAverage).toBe(Math.round(4817 / 14))
    expect(result.baseYear).toBe(2022)
    expect(result.horizon).toBe(2036)
  })

  it('signe les blocs vacants et résidences secondaires', () => {
    const { blocks } = buildAmfResult(makeResults(), EPCI, 2022)
    expect(blocks?.vacancy).toBe(-500)
    expect(blocks?.secondaryResidences).toBe(200)
    expect(blocks?.badHousing).toBe(1220)
  })

  it('fait tomber l’addition juste', () => {
    const { total, blocks } = buildAmfResult(makeResults(), EPCI, 2022)
    expect(blocks!.population).toBe(3900)
    expect(blocks!.population + blocks!.vacancy + blocks!.secondaryResidences + blocks!.badHousing).toBe(total)
  })

  it('rend un bloc vacants positif quand la vacance augmente', () => {
    expect(buildAmfResult(makeResults({ longTermVacant: 120 }), EPCI, 2022).blocks?.vacancy).toBe(120)
  })

  it.each([-300, 0])('renvoie total 0 et blocks null si le besoin vaut %i', (total) => {
    const result = buildAmfResult(makeResults({ total }), EPCI, 2022)
    expect(result).toMatchObject({ total: 0, annualAverage: 0, blocks: null })
  })

  it('renvoie blocks null quand le total arrondi tombe à 0', () => {
    const result = buildAmfResult(makeResults({ total: 4, totalFlux: 4 }), EPCI, 2022)
    expect(result).toMatchObject({ total: 0, annualAverage: 0, blocks: null })
  })

  it('met badHousing à 0 quand le stock est nul', () => {
    const { blocks } = buildAmfResult(makeResults({ totalFlux: 4817 }), EPCI, 2022)
    expect(blocks?.badHousing).toBe(0)
  })
})
