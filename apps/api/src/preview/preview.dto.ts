import { createZodDto } from 'nestjs-zod'
import { ZPreviewForSimulationBody, ZPreviewSimulationDto } from '~/schemas/simulations/simulation'

export class PreviewSimulationDto extends createZodDto(ZPreviewSimulationDto) {}
export class PreviewForSimulationBodyDto extends createZodDto(ZPreviewForSimulationBody) {}
