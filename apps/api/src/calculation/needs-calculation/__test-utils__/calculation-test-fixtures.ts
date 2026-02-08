import { CalculationContext } from '~/calculation/needs-calculation/base-calculator'
import { TEpciScenario, TScenario } from '~/schemas/scenarios/scenario'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'

export function makeCalculationContext(overrides?: Partial<CalculationContext>): CalculationContext {
  return {
    coefficient: 1,
    baseYear: 2021,
    ...overrides,
  }
}

export function makeEpciScenario(overrides?: Partial<TEpciScenario>): TEpciScenario {
  return {
    epciCode: '200000001',
    b2_tx_disparition: 0.005,
    b2_tx_restructuration: 0.002,
    b2_tx_rs: 0.05,
    b2_tx_vacance: 0.08,
    b2_tx_vacance_longue: 0.04,
    b2_tx_vacance_courte: 0.04,
    baseEpci: true,
    ...overrides,
  }
}

export function makeScenario(overrides?: Partial<TScenario>): TScenario {
  return {
    id: 'scenario-1',
    b11_etablissement: ['autreCentre'],
    b11_fortune: true,
    b11_hotel: true,
    b11_part_etablissement: 50,
    b11_sa: true,
    b12_cohab_interg_subie: 50,
    b12_heberg_particulier: true,
    b12_heberg_temporaire: true,
    b13_acc: true,
    b13_plp: true,
    b13_taux_effort: 30,
    b13_taux_reallocation: 10,
    b14_confort: 'RP_abs_sani',
    b14_occupation: 'loc',
    b14_qualite: 'FF_Ind',
    b14_taux_reallocation: 10,
    b15_loc_hors_hlm: true,
    b15_proprietaire: true,
    b15_surocc: 'Mod',
    b15_taux_reallocation: 10,
    b17_motif: 'Tout',
    b1_horizon_resorption: 2041,
    b2_scenario: 'Central_H',
    epciScenarios: [makeEpciScenario()],
    isConfidential: false,
    projection: 2041,
    source_b11: 'RP',
    source_b14: 'RP',
    source_b15: 'RP',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as TScenario
}

export function makeSimulation(overrides?: Partial<TSimulationWithEpciAndScenario>): TSimulationWithEpciAndScenario {
  return {
    id: 'sim-1',
    name: 'Test Simulation',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    epcis: [{ code: '200000001', name: 'Test EPCI', bassinName: null }],
    scenario: makeScenario(),
    ...overrides,
  } as TSimulationWithEpciAndScenario
}

export function makeStockRequirementsResults(epciCode = '200000001') {
  const makeResult = (value: number) => ({
    epcis: [{ epciCode, value, prorataValue: value }],
    total: value,
    prorataTotal: value,
  })

  return {
    noAccomodation: makeResult(100),
    hosted: makeResult(200),
    financialInadequation: makeResult(150),
    badQuality: makeResult(80),
    physicalInadequation: makeResult(120),
  }
}
