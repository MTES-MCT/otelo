import { z } from 'zod'
import { B11Etablissement } from '../../enums/b11-etablissement'
import { B15Surocc } from '../../enums/b15-surocc'
import { MotifB17 } from '../../enums/motif-b17'
import { SourceB11 } from '../../enums/source-b11'
import { SourceB14 } from '../../enums/source-b14'
import { SourceB15 } from '../../enums/source-b15'
import { ZCommonDateFields } from '../common/date-fields'
import { ZEpciScenario } from './epci-scenario'

export const ZScenarioBase = ZCommonDateFields.extend({
  id: z.string(),
  b11_etablissement: z.array(z.enum(Object.values(B11Etablissement) as [string, ...string[]])),
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
  b15_surocc: z.enum(Object.values(B15Surocc) as [string, ...string[]]),
  b15_taux_reallocation: z.number(),
  b17_motif: z.enum(Object.values(MotifB17) as [string, ...string[]]),
  b1_horizon_resorption: z.number(),
  b2_scenario: z.string(),
  epciScenarios: z.array(ZEpciScenario),
  isConfidential: z.boolean(),
  projection: z.number(),
  source_b11: z.enum(Object.values(SourceB11) as [string, ...string[]]),
  source_b14: z.enum(Object.values(SourceB14) as [string, ...string[]]),
  source_b15: z.enum(Object.values(SourceB15) as [string, ...string[]]),
})

export type TScenarioBase = z.infer<typeof ZScenarioBase>
