import { z } from 'zod'
import { commaSeparated, ZEpciCode } from '~/schemas/query'

export const ZAccommodationRatesQuery = z.object({
  epcis: commaSeparated(ZEpciCode, 50).describe('Codes EPCI séparés par des virgules'),
  millesime: z.string().max(10).optional(),
})
export type TAccommodationRatesQuery = z.output<typeof ZAccommodationRatesQuery>
