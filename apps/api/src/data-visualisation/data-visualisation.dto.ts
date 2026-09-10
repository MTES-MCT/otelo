import { createZodDto } from 'nestjs-zod'
import { ZDataVisualisationQuery } from '~/schemas/data-visualisation/data-visualisation'

export class DataVisualisationQueryDto extends createZodDto(ZDataVisualisationQuery) {}
