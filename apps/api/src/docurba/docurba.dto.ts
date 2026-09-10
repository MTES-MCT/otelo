import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { commaSeparated, ZEpciCode } from '~/schemas/query'

/** Un code absent du jeu local déclenche un appel à `geo.api.gouv.fr`, d'où le plafond. */
const MAX_EPCIS = 50

export const ZDocurbaEpcisQuery = z.object({
  codes: commaSeparated(ZEpciCode, MAX_EPCIS).describe('Codes EPCI séparés par des virgules'),
})

export class DocurbaEpcisQueryDto extends createZodDto(ZDocurbaEpcisQuery) {}

export const ZDocurbaEpciParams = z.object({
  code: ZEpciCode,
})

export class DocurbaEpciParamsDto extends createZodDto(ZDocurbaEpciParams) {}
