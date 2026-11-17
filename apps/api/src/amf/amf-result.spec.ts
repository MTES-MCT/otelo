import { EstimationBreakdownInput } from '@otelo/shared'
import { buildAmfResult } from './amf-result'

const EPCI = '200040715'

const makeResults = (overrides: { total?: number; totalFlux?: number; longTermVacant?: number; peakYear?: number } = {}) =>
  ({
    total: overrides.total ?? 4817,
    epcisTotals: [{ epciCode: EPCI, total: overrides.total ?? 4817, totalFlux: overrides.totalFlux ?? 3600 }],
    flowRequirement: {
      epcis: [
        {
          code: EPCI,
          ...(overrides.peakYear !== undefined && { data: { peakYear: overrides.peakYear } }),
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
  it('renvoie le total et la moyenne annuelle en fourchettes fines', () => {
    const result = buildAmfResult(makeResults(), EPCI, 2022)
    expect(result.total).toEqual({ min: 4000, max: 5000 })
    // 4 817 logements sur 14 ans : 344 par an.
    expect(result.annualAverage).toEqual({ min: 300, max: 400 })
    expect(result.baseYear).toBe(2022)
    expect(result.horizon).toBe(2036)
  })

  it('renvoie le détail par poste en fourchettes larges et signées', () => {
    const { blocks } = buildAmfResult(makeResults(), EPCI, 2022)
    expect(blocks).toEqual({
      population: { min: 2000, max: 5000 },
      vacancy: { min: -1000, max: -500 },
      secondaryResidences: { min: 200, max: 500 },
      badHousing: { min: 1000, max: 2000 },
    })
  })

  it('rend un bloc vacants positif quand la vacance augmente', () => {
    expect(buildAmfResult(makeResults({ longTermVacant: 120 }), EPCI, 2022).blocks?.vacancy.min).toBeGreaterThan(0)
  })

  it.each([-300, 0])('renvoie un résultat vide si le besoin vaut %i', (total) => {
    const result = buildAmfResult(makeResults({ total }), EPCI, 2022)
    expect(result).toMatchObject({ total: null, annualAverage: null, blocks: null })
  })

  it("renvoie un résultat vide quand le besoin s'arrondit à 0", () => {
    const result = buildAmfResult(makeResults({ total: 4, totalFlux: 4 }), EPCI, 2022)
    expect(result).toMatchObject({ total: null, annualAverage: null, blocks: null })
  })

  it('met badHousing sous le plancher quand le stock est nul', () => {
    const { blocks } = buildAmfResult(makeResults({ totalFlux: 4817 }), EPCI, 2022)
    expect(blocks?.badHousing).toEqual({ min: 0, max: 50 })
  })

  describe('pic de ménages', () => {
    it('renvoie peakYear null quand le pic est au-delà de 2036', () => {
      const result = buildAmfResult(makeResults({ peakYear: 2050 }), EPCI, 2022)
      expect(result.peakYear).toBeNull()
      expect(result.annualAverage).toEqual({ min: 300, max: 400 })
    })

    it('renvoie peakYear null sans détail du pic', () => {
      expect(buildAmfResult(makeResults(), EPCI, 2022).peakYear).toBeNull()
    })

    it("renvoie l'année du pic quand il précède 2036 et moyenne le besoin jusqu'au pic", () => {
      const result = buildAmfResult(makeResults({ peakYear: 2029 }), EPCI, 2022)
      expect(result.peakYear).toBe(2029)
      // 4 817 logements sur 7 ans : 688 par an.
      expect(result.annualAverage).toEqual({ min: 600, max: 700 })
    })

    it("signale un territoire déjà en baisse quand le pic est l'année de base", () => {
      const result = buildAmfResult(makeResults({ total: 0, totalFlux: 0, peakYear: 2022 }), EPCI, 2022)
      expect(result.blocks).toBeNull()
      expect(result.total).toBeNull()
      expect(result.peakYear).toBe(2022)
    })
  })
})
