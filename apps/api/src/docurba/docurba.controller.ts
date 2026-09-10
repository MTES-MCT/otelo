import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { DocurbaEpciParamsDto, DocurbaEpcisQueryDto } from './docurba.dto'
import { DocurbaEpciResult, DocurbaService } from './docurba.service'

/**
 * Routes publiques : la page de choix du territoire les consulte avant toute connexion.
 *
 * Le plafond de débit reste large : le compteur est par adresse IP, et une DDT sort
 * derrière une seule. Ce qui borne le coût d'un appel est le plafond de codes du DTO.
 */
@Controller('docurba')
@AllowAnonymous()
@Throttle({ default: { ttl: 60_000, limit: 120 } })
export class DocurbaController {
  constructor(private readonly docurbaService: DocurbaService) {}

  @Get('epcis')
  @HttpCode(HttpStatus.OK)
  async getBatchForEpcis(@Query() { codes }: DocurbaEpcisQueryDto): Promise<Record<string, DocurbaEpciResult | null>> {
    const results = await Promise.all(codes.map((code) => this.docurbaService.getForEpci(code)))
    return Object.fromEntries(codes.map((code, i) => [code, results[i] ?? null]))
  }

  @Get('epci/:code')
  @HttpCode(HttpStatus.OK)
  async getForEpci(@Param() { code }: DocurbaEpciParamsDto): Promise<DocurbaEpciResult | null> {
    return this.docurbaService.getForEpci(code)
  }
}
