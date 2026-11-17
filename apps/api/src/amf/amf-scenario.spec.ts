import { TAmfAnswers } from './amf.schemas'
import { buildAmfSimulationBody, TObservedRates } from './amf-scenario'

const rates: TObservedRates = {
  longTermVacancyRate: 0.05,
  shortTermVacancyRate: 0.03,
  txRs: 0.2,
  restructuringRate: 0.001,
  disappearanceRate: 0.002,
}

const baseAnswers: TAmfAnswers = {
  epciCode: '200040715',
  demography: 'tendance',
  vacancy: 'non',
  badHousing: true,
  secondaryResidences: 'neutre',
}

const build = (overrides: Partial<TAmfAnswers> = {}) => buildAmfSimulationBody({ ...baseAnswers, ...overrides }, rates, '2022', 'CC Test')

describe('buildAmfSimulationBody', () => {
  it('mappe plus/tendance/moins vers PH_C/Central_C/PB_C', () => {
    expect(build({ demography: 'plus' }).scenario.b2_scenario).toBe('PH_C')
    expect(build({ demography: 'tendance' }).scenario.b2_scenario).toBe('Central_C')
    expect(build({ demography: 'moins' }).scenario.b2_scenario).toBe('PB_C')
  })

  it('fixe projection 2036 et le millésime actif', () => {
    const { scenario } = build()
    expect(scenario.projection).toBe(2036)
    expect(scenario.millesime).toBe('2022')
  })

  it('réduit la vacance longue de 20 % / 10 % / 0 %', () => {
    const cases = [
      ['prioritaire', 0.04],
      ['parmi-autres', 0.045],
      ['non', 0.05],
    ] as const
    for (const [vacancy, longue] of cases) {
      const epci = build({ vacancy }).scenario.epcis['200040715']
      expect(epci.b2_tx_vacance_longue).toBeCloseTo(longue)
      expect(epci.b2_tx_vacance_courte).toBe(0.03)
      expect(epci.b2_tx_vacance).toBeCloseTo(longue + 0.03)
    }
  })

  it('applique ×0,95 / ×1 / ×1,05 au taux de résidences secondaires', () => {
    expect(build({ secondaryResidences: 'reguler' }).scenario.epcis['200040715'].b2_tx_rs).toBeCloseTo(0.19)
    expect(build({ secondaryResidences: 'neutre' }).scenario.epcis['200040715'].b2_tx_rs).toBeCloseTo(0.2)
    expect(build({ secondaryResidences: 'developper' }).scenario.epcis['200040715'].b2_tx_rs).toBeCloseTo(0.21)
  })

  it('reprend les taux de renouvellement observés', () => {
    const epci = build().scenario.epcis['200040715']
    expect(epci.b2_tx_disparition).toBe(0.002)
    expect(epci.b2_tx_restructuration).toBe(0.001)
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
      b11_part_etablissement: 0,
      b12_cohab_interg_subie: 0,
      b12_heberg_particulier: false,
      b12_heberg_temporaire: false,
      b13_acc: false,
      b13_plp: false,
      b13_taux_reallocation: 100,
      b14_taux_reallocation: 100,
      b15_taux_reallocation: 100,
    })
  })

  it('nomme la simulation et marque l’EPCI de base', () => {
    const body = build()
    expect(body.name).toBe('AMF – CC Test')
    expect(body.epci).toEqual([{ code: '200040715' }])
    expect(body.scenario.epcis['200040715'].baseEpci).toBe(true)
  })
})
