import { TCreateSimulationBody } from '~/external/external.dto'
import { TAmfAnswers } from './amf.schemas'

export const AMF_HORIZON = 2036

export type TObservedRates = {
  longTermVacancyRate: number
  shortTermVacancyRate: number
  txRs: number
  restructuringRate: number
  disappearanceRate: number
}

const DEMOGRAPHY_SCENARIO = {
  plus: 'PH_C',
  tendance: 'Central_C',
  moins: 'PB_C',
} as const

const VACANCY_REDUCTION = {
  prioritaire: 0.2,
  'parmi-autres': 0.1,
  non: 0,
} as const

const SECONDARY_RESIDENCES_FACTOR = {
  neutre: 1,
  reguler: 0.95,
  developper: 1.05,
} as const

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

export function buildAmfSimulationBody(
  answers: TAmfAnswers,
  rates: TObservedRates,
  millesime: string,
  epciName: string,
): TCreateSimulationBody {
  const longTermVacancy = rates.longTermVacancyRate * (1 - VACANCY_REDUCTION[answers.vacancy])

  return {
    name: `AMF – ${epciName}`,
    epci: [{ code: answers.epciCode }],
    scenario: {
      b2_scenario: DEMOGRAPHY_SCENARIO[answers.demography],
      projection: AMF_HORIZON,
      millesime,
      epcis: {
        [answers.epciCode]: {
          baseEpci: true,
          b2_tx_vacance_longue: longTermVacancy,
          b2_tx_vacance_courte: rates.shortTermVacancyRate,
          b2_tx_vacance: longTermVacancy + rates.shortTermVacancyRate,
          b2_tx_rs: rates.txRs * SECONDARY_RESIDENCES_FACTOR[answers.secondaryResidences],
          b2_tx_disparition: rates.disappearanceRate,
          b2_tx_restructuration: rates.restructuringRate,
        },
      },
      ...(answers.badHousing ? {} : { ...NEUTRALIZED_STOCK, b11_etablissement: [] }),
    },
  }
}
