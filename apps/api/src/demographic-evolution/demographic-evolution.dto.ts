import { z } from 'zod'
import { commaSeparated, ZEpciCode } from '~/schemas/query'

export const ZEpciCodesQuery = z.object({
  epciCodes: commaSeparated(ZEpciCode, 50).describe('Codes EPCI séparés par des virgules'),
})

export const ZEpciCodesWithMillesimeQuery = ZEpciCodesQuery.extend({
  millesime: z.string().max(10),
})
export type TEpciCodesQuery = z.output<typeof ZEpciCodesQuery>
export type TEpciCodesWithMillesimeQuery = z.output<typeof ZEpciCodesWithMillesimeQuery>
