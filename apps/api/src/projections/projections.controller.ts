import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import {
  TProjectionByAgeGroupQuery,
  TProjectionByAgeQuery,
  TProjectionByHouseholdTypeQuery,
  TProjectionBySexQuery,
  type TProjectionSeriesByZone,
  TProjectionSeriesQuery,
  TProjectionZonesQuery,
  type TProjectionZoneWithMillesime,
  type TResolvedProjectionZones,
  TResolveProjectionZonesQuery,
  ZProjectionByAgeGroupQuery,
  ZProjectionByAgeQuery,
  ZProjectionByHouseholdTypeQuery,
  ZProjectionBySexQuery,
  ZProjectionSeriesQuery,
  ZProjectionZonesQuery,
  ZResolveProjectionZonesQuery,
} from '~/schemas/projections/projections'
import { ProjectionZonesService } from './projection-zones.service'
import { ProjectionsService } from './projections.service'

/**
 * Projections démographiques détaillées Omphale, aux niveaux EPCI et bassin d'habitat.
 *
 * Les codes de zone des deux niveaux étant disjoints, le niveau est implicite dans `zoneCodes` ;
 * `level` sert de garde-fou explicite. Un appelant qui part d'un code EPCI passe par
 * `zones/resolve`, seul endroit qui sache si le territoire a une projection propre ou seulement
 * celle de son bassin.
 */
@Controller('projections')
export class ProjectionsController {
  constructor(
    private readonly projectionsService: ProjectionsService,
    private readonly projectionZonesService: ProjectionZonesService,
  ) {}

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/zones')
  @HttpCode(HttpStatus.OK)
  async getZones(@Query({ schema: ZProjectionZonesQuery }) query: TProjectionZonesQuery): Promise<TProjectionZoneWithMillesime[]> {
    return this.projectionZonesService.find(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/zones/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveZones(
    @Query({ schema: ZResolveProjectionZonesQuery }) query: TResolveProjectionZonesQuery,
  ): Promise<TResolvedProjectionZones[]> {
    return this.projectionZonesService.resolveForEpcis(query.epciCodes, query.millesime)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population')
  @HttpCode(HttpStatus.OK)
  async getPopulation(@Query({ schema: ZProjectionSeriesQuery }) query: TProjectionSeriesQuery): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulation(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population/by-sex')
  @HttpCode(HttpStatus.OK)
  async getPopulationBySex(@Query({ schema: ZProjectionBySexQuery }) query: TProjectionBySexQuery): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulationBySex(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population/by-age')
  @HttpCode(HttpStatus.OK)
  async getPopulationByAge(@Query({ schema: ZProjectionByAgeQuery }) query: TProjectionByAgeQuery): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulationByAge(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population/by-age-group')
  @HttpCode(HttpStatus.OK)
  async getPopulationByAgeGroup(
    @Query({ schema: ZProjectionByAgeGroupQuery }) query: TProjectionByAgeGroupQuery,
  ): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulationByAgeGroup(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/households')
  @HttpCode(HttpStatus.OK)
  async getHouseholds(@Query({ schema: ZProjectionSeriesQuery }) query: TProjectionSeriesQuery): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getHouseholds(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/households/by-type')
  @HttpCode(HttpStatus.OK)
  async getHouseholdsByType(
    @Query({ schema: ZProjectionByHouseholdTypeQuery }) query: TProjectionByHouseholdTypeQuery,
  ): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getHouseholdsByType(query)
  }
}
