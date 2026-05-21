import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { Consumer } from '~/common/decorators/api-consumer'
import { ApiKeyGuard } from '~/common/guards/api-key.guard'
import { ApiConsumer } from '~/generated/prisma/client'
import {
  CreateSimulationDto,
  NotFoundResponseDto,
  SimulationListItemDto,
  SimulationWithResultsDto,
  UnauthorizedResponseDto,
  UpdateScenarioDto,
} from './external.dto'
import { ExternalService } from './external.service'

@ApiTags('Simulations - Résultats méthodo Otelo')
@ApiBearerAuth()
@Controller('external')
@AllowAnonymous()
@UseGuards(ApiKeyGuard)
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Post('simulations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une simulation et obtenir les résultats',
    description:
      'Crée un scénario, une simulation sur les EPCI sélectionnés, ' +
      'calcule les besoins en logements (stock B1 + flux B2) et retourne les résultats complets.',
  })
  @ApiBody({ type: CreateSimulationDto })
  @ApiResponse({ status: 201, description: 'Simulation créée avec résultats', type: SimulationWithResultsDto })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', type: UnauthorizedResponseDto })
  async createSimulation(@Consumer() consumer: ApiConsumer, @Body() body: CreateSimulationDto) {
    return this.externalService.createSimulation(consumer.id, body)
  }

  @Put('simulations/:simulationId/scenario')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour le paramétrage et recalculer les résultats',
    description:
      'Met à jour les paramètres du scénario (B1-B15, projection, etc.) ' +
      'et/ou les taux par EPCI (B2). Recalcule et retourne les résultats.',
  })
  @ApiParam({ name: 'simulationId', description: 'ID de la simulation', format: 'uuid' })
  @ApiBody({ type: UpdateScenarioDto })
  @ApiResponse({ status: 200, description: 'Résultats recalculés', type: SimulationWithResultsDto })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', type: UnauthorizedResponseDto })
  @ApiResponse({ status: 404, description: 'Simulation non trouvée', type: NotFoundResponseDto })
  async updateSimulation(@Consumer() consumer: ApiConsumer, @Param('simulationId') simulationId: string, @Body() body: UpdateScenarioDto) {
    return this.externalService.updateSimulation(consumer.id, simulationId, body)
  }

  @Get('simulations/:simulationId/results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Obtenir les résultats d'une simulation",
    description: 'Calcule (ou recalcule) les besoins en logements et retourne les résultats complets.',
  })
  @ApiParam({ name: 'simulationId', description: 'ID de la simulation', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Résultats de la simulation', type: SimulationWithResultsDto })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', type: UnauthorizedResponseDto })
  @ApiResponse({ status: 404, description: 'Simulation non trouvée', type: NotFoundResponseDto })
  async getResults(@Consumer() consumer: ApiConsumer, @Param('simulationId') simulationId: string) {
    return this.externalService.getResults(consumer.id, simulationId)
  }

  @Get('simulations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les simulations du consommateur',
    description: 'Retourne toutes les simulations créées par ce consommateur API, triées par date de modification.',
  })
  @ApiResponse({ status: 200, description: 'Liste des simulations', type: [SimulationListItemDto] })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', type: UnauthorizedResponseDto })
  async listSimulations(@Consumer() consumer: ApiConsumer) {
    return this.externalService.listSimulations(consumer.id)
  }

  @Delete('simulations/:simulationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une simulation',
    description: 'Supprime (soft-delete) une simulation appartenant au consommateur.',
  })
  @ApiParam({ name: 'simulationId', description: 'ID de la simulation', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Simulation supprimée' })
  @ApiResponse({ status: 401, description: 'Clé API invalide ou inactive', type: UnauthorizedResponseDto })
  @ApiResponse({ status: 404, description: 'Simulation non trouvée', type: NotFoundResponseDto })
  async deleteSimulation(@Consumer() consumer: ApiConsumer, @Param('simulationId') simulationId: string) {
    return this.externalService.deleteSimulation(consumer.id, simulationId)
  }
}
