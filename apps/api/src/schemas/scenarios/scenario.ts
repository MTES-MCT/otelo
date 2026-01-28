import { z } from 'zod'
import { B11Etablissement, B15Surocc } from '~/generated/prisma/client'
import { ZCommonDateFields } from '@shared'
import { ZDemographicEvolutionOmphaleCustom } from '~/schemas/demographic-evolution-custom/demographic-evolution-custom'

export enum ESourceB11 {
  RP = 'RP',
  SNE = 'SNE',
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

export const ZScenario = ZCommonDateFields.extend({
  b11_etablissement: z.array(z.nativeEnum(B11Etablissement)),
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
  b14_qualite: z.string().optional(),
  b14_taux_reallocation: z.number(),
  b15_loc_hors_hlm: z.boolean(),
  b15_proprietaire: z.boolean(),
  b15_surocc: z.nativeEnum(B15Surocc),
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
  demographicEvolutionOmphaleCustom: z.array(ZDemographicEvolutionOmphaleCustom).optional(),
})

export type TScenario = z.infer<typeof ZScenario>

export const ZInitScenario = ZCommonDateFields.extend({
  b2_scenario: z.string(),
  epcis: z.record(
    z.string(),
    z.object({
      b2_tx_rs: z.number().optional(),
      b2_tx_vacance: z.number().optional(),
      baseEpci: z.boolean(),
    }),
  ),
  projection: z.number(),
  demographicEvolutionOmphaleCustomIds: z.array(z.string().uuid()).optional(),
})

export type TInitScenario = z.infer<typeof ZInitScenario>

export const ZUpdateSimulationDto = ZScenario.omit({
  b17_motif: true,
  createdAt: true,
  isConfidential: true,
  updatedAt: true,
  demographicEvolutionOmphaleCustom: true,
})

export type TUpdateSimulationDto = z.infer<typeof ZUpdateSimulationDto>

export type TEpciScenario = z.infer<typeof ZEpciScenario>
