import { getMenagesLabel, getOmphaleKey, getPopulationKey, getPopulationLabel } from './labels'

// Les 9 combinaisons possibles de `scenario.b2_scenario` : projection de population (Central/PB/PH)
// croisée avec la décohabitation (B = décélération, C = tendanciel, H = accélération).
const ALL_SCENARIOS = ['Central_B', 'Central_C', 'Central_H', 'PB_B', 'PB_C', 'PB_H', 'PH_B', 'PH_C', 'PH_H']

describe('labels', () => {
  it.each(ALL_SCENARIOS)('résout toutes les clés et libellés pour %s', (scenario) => {
    // Une clé manquante fait tomber la valeur exportée à 0 au lieu du nombre de ménages
    expect(getOmphaleKey(scenario)).toBeDefined()
    expect(getPopulationKey(scenario)).toBeDefined()
    expect(getPopulationLabel(scenario)).toBeDefined()
    expect(getMenagesLabel(scenario)).toBeDefined()
  })

  it('associe chaque scénario à sa colonne omphale', () => {
    expect(ALL_SCENARIOS.map(getOmphaleKey)).toEqual(['centralB', 'centralC', 'centralH', 'pbB', 'pbC', 'pbH', 'phB', 'phC', 'phH'])
  })
})
