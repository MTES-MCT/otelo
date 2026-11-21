import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { TAmfAnswers } from './amf.schemas'
import { buildAmfScenarioVariant, buildAmfSimulationBody, TObservedRates, withAmfVariant } from './amf-scenario'

const EPCI = '200040715'

const rates: TObservedRates = {
  longTermVacancyRate: 0.05,
  shortTermVacancyRate: 0.03,
  txRs: 0.2,
}

const baseAnswers: TAmfAnswers = {
  epciCode: EPCI,
  demography: 'tendance',
  vacancy: 'non',
  badHousing: true,
  secondaryResidences: 'stable',
}

const variant = (overrides: Partial<TAmfAnswers>, which: 'low' | 'high') =>
  buildAmfScenarioVariant({ ...baseAnswers, ...overrides }, rates, which)

const build = (overrides: Partial<TAmfAnswers> = {}) => buildAmfSimulationBody({ ...baseAnswers, ...overrides }, rates, '2022', 'CC Test')

describe('buildAmfScenarioVariant', () => {
  it('croise le scénario de population avec une décohabitation tendancielle (basse) ou accélérée (haute)', () => {
    expect(variant({ demography: 'plus' }, 'low').b2_scenario).toBe('PH_C')
    expect(variant({ demography: 'plus' }, 'high').b2_scenario).toBe('PH_H')
    expect(variant({ demography: 'tendance' }, 'high').b2_scenario).toBe('Central_H')
    expect(variant({ demography: 'moins' }, 'low').b2_scenario).toBe('PB_C')
  })

  it.each([
    ['prioritaire', 0.03, 0.035],
    ['parmi-autres', 0.04, 0.0425],
    ['non', 0.05, 0.05],
  ] as const)('remobilise la vacance longue pour « %s »', (vacancy, low, high) => {
    expect(variant({ vacancy }, 'low').rates.b2_tx_vacance_longue).toBeCloseTo(low)
    expect(variant({ vacancy }, 'high').rates.b2_tx_vacance_longue).toBeCloseTo(high)
    expect(variant({ vacancy }, 'high').rates.b2_tx_vacance).toBeCloseTo(high + 0.03)
    expect(variant({ vacancy }, 'high').rates.b2_tx_vacance_courte).toBe(0.03)
  })

  it.each([
    ['hausse', 0.21, 0.215],
    ['stable', 0.2, 0.2],
    ['maitrise', 0.193, 0.195],
    ['recuperation', 0.185, 0.19],
  ] as const)('fait varier le taux de résidences secondaires pour « %s »', (secondaryResidences, low, high) => {
    expect(variant({ secondaryResidences }, 'low').rates.b2_tx_rs).toBeCloseTo(low)
    expect(variant({ secondaryResidences }, 'high').rates.b2_tx_rs).toBeCloseTo(high)
  })

  it('ne descend pas sous un taux de résidences secondaires nul', () => {
    const result = buildAmfScenarioVariant({ ...baseAnswers, secondaryResidences: 'recuperation' }, { ...rates, txRs: 0.005 }, 'low')
    expect(result.rates.b2_tx_rs).toBe(0)
  })

  it('résorbe le mal-logement en 2050 (basse) ou en 2040 (haute)', () => {
    expect(variant({}, 'low').b1_horizon_resorption).toBe(2050)
    expect(variant({}, 'high').b1_horizon_resorption).toBe(2040)
    expect(build().scenario.b1_horizon_resorption).toBe(2050)
  })

  it('neutralise démolitions et restructurations', () => {
    expect(variant({}, 'low').rates).toMatchObject({ b2_tx_disparition: 0, b2_tx_restructuration: 0 })
  })
})

describe('buildAmfSimulationBody', () => {
  it('enregistre la variante basse, projetée en 2036 sur le millésime actif', () => {
    const { scenario } = build({ vacancy: 'prioritaire' })
    expect(scenario.b2_scenario).toBe('Central_C')
    expect(scenario.projection).toBe(2036)
    expect(scenario.millesime).toBe('2022')
    expect(scenario.epcis[EPCI].b2_tx_vacance_longue).toBeCloseTo(0.03)
  })

  it('ne transmet aucun paramètre de stock si mal-logement = oui', () => {
    const keys = Object.keys(build({ badHousing: true }).scenario)
    expect(keys.filter((k) => /^b1[1-5]_/.test(k))).toEqual([])
  })

  it('neutralise le stock si mal-logement = non', () => {
    expect(build({ badHousing: false }).scenario).toMatchObject({
      b11_sa: false,
      b11_fortune: false,
      b11_hotel: false,
      b11_etablissement: [],
      b13_taux_reallocation: 100,
      b14_taux_reallocation: 100,
      b15_taux_reallocation: 100,
    })
  })

  it('nomme la simulation et marque l’EPCI de base', () => {
    const body = build()
    expect(body.name).toBe('AMF – CC Test')
    expect(body.epci).toEqual([{ code: EPCI }])
    expect(body.scenario.epcis[EPCI].baseEpci).toBe(true)
  })
})

describe('withAmfVariant', () => {
  it("remplace le scénario et les taux de l'EPCI sans toucher à l'original", () => {
    const simulation = {
      id: 'sim-1',
      scenario: {
        b2_scenario: 'Central_C',
        epciScenarios: [
          { epciCode: EPCI, b2_tx_rs: 0.2, baseEpci: true },
          { epciCode: '999999999', b2_tx_rs: 0.1, baseEpci: false },
        ],
      },
    } as unknown as TSimulationWithEpciAndScenario
    const high = variant({ secondaryResidences: 'hausse' }, 'high')

    const copy = withAmfVariant(simulation, EPCI, high)

    expect(copy.scenario.b2_scenario).toBe('Central_H')
    expect(copy.scenario.b1_horizon_resorption).toBe(2040)
    expect(copy.scenario.epciScenarios[0]).toMatchObject({ epciCode: EPCI, baseEpci: true, b2_tx_rs: high.rates.b2_tx_rs })
    expect(copy.scenario.epciScenarios[1].b2_tx_rs).toBe(0.1)
    expect(simulation.scenario.b2_scenario).toBe('Central_C')
    expect(simulation.scenario.epciScenarios[0].b2_tx_rs).toBe(0.2)
  })
})
