import { z } from 'zod'

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
