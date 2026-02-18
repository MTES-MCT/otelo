import { ZCommonDateFields } from '@shared'
import { z } from 'zod'
import { ZDemographicEvolutionOmphaleCustom } from '~/schemas/demographic-evolution-custom'

export enum ESourceB11 {
  RP = 'RP',
  SNE = 'SNE',
}

export enum ESourceB14 {
  FF = 'FF',
  Filo = 'Filo',
  RP = 'RP',
}

export enum ESourceB15 {
  Filo = 'Filo',
  RP = 'RP',
}

export const ZEpciScenario = z.object({
  b2_tx_disparition: z.number(),
  b2_tx_restructuration: z.number(),
  b2_tx_rs: z.number(),
  b2_tx_vacance: z.number(),
  b2_tx_vacance_longue: z.number(),
  b2_tx_vacance_courte: z.number(),
  epciCode: z.string(),
  baseEpci: z.boolean(),
})
export type TEpciScenario = z.infer<typeof ZEpciScenario>

export const ZScenario = ZCommonDateFields.extend({
  b11_etablissement: z.array(z.string()),
  b11_fortune: z.boolean(),
  b11_hotel: z.boolean(),
  b11_part_etablissement: z.number(),
  b11_sa: z.boolean(),
  b12_cohab_interg_subie: z.number(),
  b12_heberg_particulier: z.boolean(),
  b12_heberg_temporaire: z.boolean(),
  b13_acc: z.boolean(),
  b13_plp: z.boolean(),
  b13_taux_effort: z.number(),
  b13_taux_reallocation: z.number(),
  b14_confort: z.string(),
  b14_occupation: z.string(),
  b14_qualite: z.string(),
  b14_taux_reallocation: z.number(),
  b15_loc_hors_hlm: z.boolean(),
  b15_proprietaire: z.boolean(),
  b15_surocc: z.string(),
  b15_taux_reallocation: z.number(),
  b17_motif: z.union([z.literal('Tout'), z.literal('Env'), z.literal('Assis'), z.literal('Rappr'), z.literal('Trois')]),
  b1_horizon_resorption: z.number(),
  b2_scenario: z.string(),
  epciScenarios: z.array(ZEpciScenario),
  id: z.string(),
  isConfidential: z.boolean(),
  projection: z.number(),
  source_b11: z.nativeEnum(ESourceB11),
  source_b14: z.union([z.literal('RP'), z.literal('Filo'), z.literal('FF')]),
  source_b15: z.union([z.literal('RP'), z.literal('Filo')]),
  millesime: z.string(),
  demographicEvolutionOmphaleCustom: z.array(ZDemographicEvolutionOmphaleCustom),
})

export type TScenario = z.infer<typeof ZScenario>

export const ZScenarioWithSimulationId = z.object({
  id: z.string(),
  scenario: ZScenario,
})

export type TScenarioWithSimulationId = z.infer<typeof ZScenarioWithSimulationId>
