import { z } from 'zod'
import { commaSeparated, ZEpciCode } from '~/schemas/query'

/** Un code absent du jeu local déclenche un appel à `geo.api.gouv.fr`, d'où le plafond. */
const MAX_EPCIS = 50

export const ZDocurbaEpcisQuery = z.object({
  codes: commaSeparated(ZEpciCode, MAX_EPCIS).describe('Codes EPCI séparés par des virgules'),
})

export const ZDocurbaEpciParams = z.object({
  code: ZEpciCode,
})
export type TDocurbaEpcisQuery = z.output<typeof ZDocurbaEpcisQuery>
export type TDocurbaEpciParams = z.output<typeof ZDocurbaEpciParams>
