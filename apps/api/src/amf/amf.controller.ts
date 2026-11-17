import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { Consumer } from '~/common/decorators/api-consumer'
import { ApiKeyGuard } from '~/common/guards/api-key.guard'
import { ApiConsumer } from '~/generated/prisma/client'
import { ZNotFoundResponse, ZUnauthorizedResponse } from '../external/external.dto'
import {
  TAmfCreateSimulationBody,
  TAmfCreateSimulationResponse,
  TAmfEpci,
  TAmfEpciParams,
  TAmfShareContactsBody,
  ZAmfCreateSimulationBody,
  ZAmfCreateSimulationResponse,
  ZAmfEpci,
  ZAmfEpciParams,
  ZAmfShareContactsBody,
} from './amf.schemas'
import { AmfService } from './amf.service'

@ApiTags('Questionnaire AMF')
@ApiBearerAuth()
@Controller('amf')
@AllowAnonymous()
@UseGuards(ApiKeyGuard)
@Throttle({ default: { ttl: 60_000, limit: 20 } })
export class AmfController {
  constructor(private readonly amfService: AmfService) {}

  @Get('epcis/:epciCode')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Obtenir les informations d'un EPCI pour le questionnaire" })
  @ApiParam({ name: 'epciCode', description: "Code SIREN de l'EPCI (9 chiffres)" })
  @ApiResponse({ status: 200, description: "Informations de l'EPCI", standardSchema: ZAmfEpci })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', standardSchema: ZUnauthorizedResponse })
  @ApiResponse({ status: 404, description: 'EPCI non trouvé', standardSchema: ZNotFoundResponse })
  async getEpci(@Param({ schema: ZAmfEpciParams }) { epciCode }: TAmfEpciParams): Promise<TAmfEpci> {
    return this.amfService.getEpci(epciCode)
  }

  @Post('simulations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une simulation à partir des réponses du questionnaire' })
  @ApiResponse({ status: 201, description: 'Simulation créée avec résultat', standardSchema: ZAmfCreateSimulationResponse })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', standardSchema: ZUnauthorizedResponse })
  @ApiResponse({ status: 404, description: 'EPCI non trouvé', standardSchema: ZNotFoundResponse })
  async createSimulation(
    @Consumer() consumer: ApiConsumer,
    @Body({ schema: ZAmfCreateSimulationBody }) body: TAmfCreateSimulationBody,
  ): Promise<TAmfCreateSimulationResponse> {
    return this.amfService.createSimulation(consumer.id, body)
  }

  @Post('leads/:leadId/contacts')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enregistrer les contacts avec lesquels partager le résultat' })
  @ApiParam({ name: 'leadId', description: 'ID du lead', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Contacts enregistrés' })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', standardSchema: ZUnauthorizedResponse })
  @ApiResponse({ status: 404, description: 'Lead non trouvé', standardSchema: ZNotFoundResponse })
  async addContacts(@Param('leadId') leadId: string, @Body({ schema: ZAmfShareContactsBody }) body: TAmfShareContactsBody): Promise<void> {
    return this.amfService.addContacts(leadId, body)
  }
}
