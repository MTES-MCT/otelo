import { createZodDto } from 'nestjs-zod'
import { ZCheckPowerpointRequest, ZRequestPowerpoint } from '~/schemas/export-powerpoint/export-powerpoint'

export class CheckPowerpointRequestDto extends createZodDto(ZCheckPowerpointRequest) {}

export class RequestPowerpointDto extends createZodDto(ZRequestPowerpoint) {}
