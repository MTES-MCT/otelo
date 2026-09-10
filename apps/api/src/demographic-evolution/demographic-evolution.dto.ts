import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { commaSeparated, ZEpciCode } from '~/schemas/query'

const ZEpciCodesQuery = z.object({
  epciCodes: commaSeparated(ZEpciCode, 50).describe('Codes EPCI séparés par des virgules'),
})

const ZEpciCodesWithMillesimeQuery = ZEpciCodesQuery.extend({
  millesime: z.string().max(10),
})

export class EpciCodesQueryDto extends createZodDto(ZEpciCodesQuery) {}
export class EpciCodesWithMillesimeQueryDto extends createZodDto(ZEpciCodesWithMillesimeQuery) {}
