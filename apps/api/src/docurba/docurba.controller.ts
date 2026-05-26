import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { DocurbaEpciResult, DocurbaService } from './docurba.service'

@Controller('docurba')
@AllowAnonymous()
export class DocurbaController {
  constructor(private readonly docurbaService: DocurbaService) {}

  @Get('epcis')
  @HttpCode(HttpStatus.OK)
  async getBatchForEpcis(@Query('codes') codesParam: string): Promise<Record<string, DocurbaEpciResult | null>> {
    const codes = (codesParam ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    const results = await Promise.all(codes.map((code) => this.docurbaService.getForEpci(code)))
    return Object.fromEntries(codes.map((code, i) => [code, results[i] ?? null]))
  }

  @Get('epci/:code')
  @HttpCode(HttpStatus.OK)
  async getForEpci(@Param('code') code: string): Promise<DocurbaEpciResult | null> {
    return this.docurbaService.getForEpci(code)
  }
}
