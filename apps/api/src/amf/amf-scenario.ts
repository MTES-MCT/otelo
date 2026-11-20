import { TCreateSimulationBody } from '~/external/external.dto'
import { TSimulationWithEpciAndScenario } from '~/schemas/simulations/simulation'
import { TAmfAnswers } from './amf.schemas'

export const AMF_HORIZON = 2036

export type TObservedRates = {
  longTermVacancyRate: number
  shortTermVacancyRate: number
  txRs: number
}

/**
 * Chaque réponse se traduit par une fourchette : la variante basse retient les paramètres qui minimisent le besoin,
 * la variante haute ceux qui le maximisent. Le résultat affiché est l'écart entre les deux.
 */
export type TAmfVariant = 'low' | 'high'

const POPULATION_SCENARIO = {
  plus: 'PH',
  tendance: 'Central',
  moins: 'PB',
} as const

/** Décohabitation tendancielle pour la variante basse, accélérée pour la variante haute. */
const HOUSEHOLDS_SCENARIO: Record<TAmfVariant, 'C' | 'H'> = { low: 'C', high: 'H' }

/** Part des logements vacants de longue durée remis en occupation d'ici l'horizon. */
const VACANCY_REMOBILISATION: Record<TAmfAnswers['vacancy'], Record<TAmfVariant, number>> = {
  prioritaire: { low: 0.4, high: 0.3 },
  'parmi-autres': { low: 0.2, high: 0.15 },
  non: { low: 0, high: 0 },
}

/** Variation, en points de part du parc, du taux de résidences secondaires. */
const SECONDARY_RESIDENCES_POINTS: Record<TAmfAnswers['secondaryResidences'], Record<TAmfVariant, number>> = {
  hausse: { low: 0.01, high: 0.015 },
  stable: { low: 0, high: 0 },
  maitrise: { low: -0.007, high: -0.005 },
  recuperation: { low: -0.015, high: -0.01 },
}

/**
 * Année de résorption complète du mal-logement, portée par le scénario (`b1_horizon_resorption`) : le moteur
 * proratise le stock jusqu'à l'horizon de projection. La plus lointaine étale le besoin, donc le réduit chaque année.
 */
export const BAD_HOUSING_RESORPTION: Record<TAmfVariant, number> = { low: 2050, high: 2040 }

const NEUTRALIZED_STOCK = {
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
} as const

export type TAmfScenarioVariant = {
  b1_horizon_resorption: number
  b2_scenario: `${(typeof POPULATION_SCENARIO)[keyof typeof POPULATION_SCENARIO]}_${'C' | 'H'}`
  rates: {
    b2_tx_vacance_longue: number
    b2_tx_vacance_courte: number
    b2_tx_vacance: number
    b2_tx_rs: number
    b2_tx_disparition: number
    b2_tx_restructuration: number
  }
}

export function buildAmfScenarioVariant(answers: TAmfAnswers, rates: TObservedRates, variant: TAmfVariant): TAmfScenarioVariant {
  const longTermVacancy = rates.longTermVacancyRate * (1 - VACANCY_REMOBILISATION[answers.vacancy][variant])

  return {
    b1_horizon_resorption: BAD_HOUSING_RESORPTION[variant],
    b2_scenario: `${POPULATION_SCENARIO[answers.demography]}_${HOUSEHOLDS_SCENARIO[variant]}`,
    rates: {
      b2_tx_vacance_longue: longTermVacancy,
      b2_tx_vacance_courte: rates.shortTermVacancyRate,
      b2_tx_vacance: longTermVacancy + rates.shortTermVacancyRate,
      b2_tx_rs: Math.max(0, rates.txRs + SECONDARY_RESIDENCES_POINTS[answers.secondaryResidences][variant]),
      // Démolitions, divisions et transformations ne sont pas estimées par le questionnaire : le résultat les signale à part.
      b2_tx_disparition: 0,
      b2_tx_restructuration: 0,
    },
  }
}

/** Corps de la simulation enregistrée, construite sur la variante basse. */
export function buildAmfSimulationBody(
  answers: TAmfAnswers,
  rates: TObservedRates,
  millesime: string,
  epciName: string,
): TCreateSimulationBody {
  const { b1_horizon_resorption, b2_scenario, rates: epciRates } = buildAmfScenarioVariant(answers, rates, 'low')

  return {
    name: `AMF – ${epciName}`,
    epci: [{ code: answers.epciCode }],
    scenario: {
      b1_horizon_resorption,
      b2_scenario,
      projection: AMF_HORIZON,
      millesime,
      epcis: {
        [answers.epciCode]: { baseEpci: true, ...epciRates },
      },
      ...(answers.badHousing ? {} : { ...NEUTRALIZED_STOCK, b11_etablissement: [] }),
    },
  }
}

/** Copie de la simulation enregistrée, paramétrée sur une autre variante, pour un calcul en mémoire. */
export function withAmfVariant(
  simulation: TSimulationWithEpciAndScenario,
  epciCode: string,
  variant: TAmfScenarioVariant,
): TSimulationWithEpciAndScenario {
  return {
    ...simulation,
    scenario: {
      ...simulation.scenario,
      b1_horizon_resorption: variant.b1_horizon_resorption,
      b2_scenario: variant.b2_scenario,
      epciScenarios: simulation.scenario.epciScenarios.map((epci) => (epci.epciCode === epciCode ? { ...epci, ...variant.rates } : epci)),
    },
  }
}
