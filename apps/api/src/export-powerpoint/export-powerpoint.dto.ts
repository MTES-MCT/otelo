import { createZodDto } from 'nestjs-zod'
import { ZCheckPowerpointRequest } from '~/schemas/export-powerpoint/export-powerpoint'

export class CheckPowerpointRequestDto extends createZodDto(ZCheckPowerpointRequest) {}
